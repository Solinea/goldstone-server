
function vcpuGraph(location, interval, start, end) {
    var chartConstants = {
                uriBase: "/intelligence/compute/vcpu_stats",
                totalField : "avg_configured_vcpus",
                usedField : "avg_inuse_vcpus",
                resourceLabel: "CPU Cores",
                loadingIndicator: "#vcpu-loading-indicator"
        }

        _renderResourceChart(location, interval, start, end, chartConstants)
}