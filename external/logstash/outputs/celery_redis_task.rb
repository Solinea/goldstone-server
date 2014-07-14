# encoding: utf-8
require "logstash/outputs/base"
require "logstash/namespace"
require "stud/buffer"
require "securerandom"

# This output will send events to a Redis queue using RPUSH.
# The RPUSH command is supported in Redis v0.0.7+. Using
# PUBLISH to a channel requires at least v1.3.8+.
# While you may be able to make these Redis versions work,
# the best performance and stability will be found in more 
# recent stable versions.  Versions 2.6.0+ are recommended.
#
# For more information about Redis, see <http://redis.io/>
#
class LogStash::Outputs::Redis < LogStash::Outputs::Base

  include Stud::Buffer

  config_name "celery_redis_task"
  milestone 1

  # Name is used for logging in case there are multiple instances.
  # TODO: delete
  # config :name, :validate => :string, :default => 'default',
  #  :deprecated => true

  # The hostname(s) of your Redis server(s). Ports may be specified on any
  # hostname, which will override the global port config.
  #
  # For example:
  #
  #     "127.0.0.1"
  #     ["127.0.0.1", "127.0.0.2"]
  #     ["127.0.0.1:6380", "127.0.0.1"]
  config :redis_host, :validate => :array, :default => ["127.0.0.1"]

  # Shuffle the host list during Logstash startup.
  config :shuffle_hosts, :validate => :boolean, :default => true

  # The default port to connect on. Can be overridden on any hostname.
  config :port, :validate => :number, :default => 6379

  # The Redis database number.
  config :db, :validate => :number, :default => 0

  # Redis initial connection timeout in seconds.
  config :timeout, :validate => :number, :default => 5

  # Password to authenticate with.  There is no authentication by default.
  config :password, :validate => :password

  # The name of a Redis list or channel. Dynamic names are
  # valid here, for example "logstash-%{type}".
  config :key, :validate => :string, :required => true

  # The name of the celery task to call.  For example:
  # goldstone.apps.logging.tasks.process_host_stream
  config :celery_task, :validate => :string, :required => true

  # The routing key that the celery worker listens on
  config :celery_routing_key :validate => :string, :default => "default"

  # The event fields to include as task arguments.
  config :celery_task_args, :validate => :array, :default => []

  # Interval for reconnecting to failed Redis connections
  config :reconnect_interval, :validate => :number, :default => 1

  # In case Redis `data_type` is "list" and has more than @congestion_threshold items,
  # block until someone consumes them and reduces congestion, otherwise if there are
  # no consumers Redis will run out of memory, unless it was configured with OOM protection.
  # But even with OOM protection, a single Redis list can block all other users of Redis,
  # until Redis CPU consumption reaches the max allowed RAM size.
  # A default value of 0 means that this limit is disabled.
  # Only supported for `list` Redis `data_type`.
  config :congestion_threshold, :validate => :number, :default => 0

  # How often to check for congestion. Default is one second.
  # Zero means to check on every event.
  config :congestion_interval, :validate => :number, :default => 1

  def register
    require 'redis'

    @data_type = 'list'
    if not @key
      raise RuntimeError.new(
        "Must define key parameter"
      )
    end

    @redis = nil
    if @shuffle_hosts
        @redis_host.shuffle!
    end
    @host_idx = 0

    @congestion_check_times = Hash.new { |h,k| h[k] = Time.now.to_i - @congestion_interval }
  end # def register

  def receive(event)
    return unless output?(event)

    key = event.sprintf(@key)
    args = @celery_task_args.map{|event_key| event[event_key]}

    begin
      payload = {
          :body => {
             :task => @celery_task,
             :id => SecureRandom.uuid,
             :args => args
          }.to_json,
          :properties => {
              :delivery_info => {
                  :priority => 0,
                  :routing_key => @celery_routing_key,
                  :exchange => "default"
              },
              :delivery_mode => 2,
              :delivery_tag => SecureRandom.uuid
          },
          :'content-type' => "application/json",
          :'content-encoding' => "utf-8",
      }.to_json
    rescue Encoding::UndefinedConversionError, ArgumentError
      puts "FAILUREENCODING"
      @logger.error("Failed to convert event to JSON. Invalid UTF-8, maybe?",
                    :event => event.inspect)
      return
    end

    begin
      @redis ||= connect
      congestion_check(key)
      @redis.rpush(key, payload)
    rescue => e
      @logger.warn("Failed to send event to Redis", :event => event,
                   :identity => identity, :exception => e,
                   :backtrace => e.backtrace)
      sleep @reconnect_interval
      @redis = nil
      retry
    end
  end # def receive

  def congestion_check(key)
    return if @congestion_threshold == 0
    if (Time.now.to_i - @congestion_check_times[key]) >= @congestion_interval # Check congestion only if enough time has passed since last check.
      while @redis.llen(key) > @congestion_threshold # Don't push event to Redis key which has reached @congestion_threshold.
        @logger.warn? and @logger.warn("Redis key size has hit a congestion threshold #{@congestion_threshold} suspending output for #{@congestion_interval} seconds")
        sleep @congestion_interval
      end
      @congestion_check_time = Time.now.to_i
    end
  end

  # called from Stud::Buffer#buffer_flush when there are events to flush
  def flush(events, key, teardown=false)
    @redis ||= connect
    # we should not block due to congestion on teardown
    # to support this Stud::Buffer#buffer_flush should pass here the :final boolean value.
    congestion_check(key) unless teardown
    @redis.rpush(key, events)
  end
  # called from Stud::Buffer#buffer_flush when an error occurs
  def on_flush_error(e)
    @logger.warn("Failed to send backlog of events to Redis",
      :identity => identity,
      :exception => e,
      :backtrace => e.backtrace
    )
    @redis = connect
  end

  def teardown
    if @batch
      buffer_flush(:final => true)
    end
    if @data_type == 'channel' and @redis
      @redis.quit
      @redis = nil
    end
  end

  private
  def connect
    @current_host, @current_port = @redis_host[@host_idx].split(':')
    @host_idx = @host_idx + 1 >= @redis_host.length ? 0 : @host_idx + 1

    if not @current_port
      @current_port = @port
    end

    params = {
      :host => @current_host,
      :port => @current_port,
      :timeout => @timeout,
      :db => @db
    }
    @logger.debug(params)

    if @password
      params[:password] = @password.value
    end

    Redis.new(params)
  end # def connect

  # A string used to identify a Redis instance in log messages
  def identity
    @name || "redis://#{@password}@#{@current_host}:#{@current_port}/#{@db} #{@data_type}:#{@key}"
  end

end
