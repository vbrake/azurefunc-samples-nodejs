const rp = require('request-promise');
const msRestAzure  = require("ms-rest-azure");
const computeManagementClient = require('azure-arm-compute');

function doneWithError(context, err) {
    context.log('err: ' + err);
    context.res = {
        status: 500,
        body: {'error': err}
    };
    context.done();
}

function getVirtualMachinesRunning(context, credentials, subscriptionId) {
    var computeClient = new computeManagementClient(credentials, subscriptionId);
    context.log('getVirtualMachinesRunning');
    getVirtualMachines(context, computeClient, (res) => {
        runningVms = getVirtualMachineStatuses(context, computeClient, res);
        context.res = {
                status: 200,
                body: runnningVms
            };
        context.done();        
    });
}

function getVirtualMachines(context, computeClient, callback) {
    context.log('getVirtualMachines');
    computeClient.virtualMachines.listAll()
        .then((res) => {
            callback(res);
        })
        .catch((err) => {
            doneWithError(context, err);
        });
}

function getVirtualMachineStatuses(context, computeClient, res) {
    context.log('getVirtualMachineStatuses');
    var vms = res.map(function(item) {
        var filterRG = new RegExp('\/subscriptions\/.+?\/resourceGroups\/(.+?)\/.*?$');
        filtered = filterRG.exec(item.id);
        var resourceGroup = filtered[1];
        result = {
            resourceGroup: resourceGroup,
            name: item.name
        }
        return result;

        // instanceView = await computeClient.virtualMachines.instanceView(resourceGroup, item.name)
        // return instanceView;
    });
    return vms;
}

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    status = 400;
    body = "Something is wrong. :(";

    subscriptionId = process.env['subscriptionId'];

    msRestAzure.loginWithAppServiceMSI()
        .then((credentials) => {
            getVirtualMachinesRunning(context, credentials, subscriptionId);
        })
        .catch((err) => {
            doneWithError(context, err);
        });
};