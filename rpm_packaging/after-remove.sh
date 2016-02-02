# delete the goldstone user and group if this is the last instance
if [[ $# == 1 && $1 == 0 ]] ; then
    rm -rf /opt/goldstone/bin > /dev/null 2>&1 \
        || /bin/true
    /usr/sbin/userdel goldstone > /dev/null 2>&1 \
        || /bin/true
    /usr/sbin/groupdel goldstone > /dev/null 2>&1 \
        || /bin/true
fi
