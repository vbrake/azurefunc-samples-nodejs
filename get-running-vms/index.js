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

function done(context, status, body) {
    context.res = {
        status: status,
        body: body
    };
    context.done();
}

function getVirtualMachinesRunning(context, credentials, subscriptionId) {
    var computeClient = new computeManagementClient(credentials, subscriptionId);

    getVirtualMachines(context, computeClient, (res) => {
        runningVms = getVirtualMachineStatuses(context, computeClient, res);
        done(context, 200, runningVms);     
    });
}

function getVirtualMachines(context, computeClient, callback) {
    computeClient.virtualMachines.listAll()
        .then(callback)
        .catch((err) => {
            doneWithError(context, err);
        });
}

function getVirtualMachineStatuses(context, computeClient, res) {
    var vms = res.map((item) => {
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