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

async function getVirtualMachinesRunning(context, credentials, subscriptionId) {
    var computeClient = new computeManagementClient(credentials, subscriptionId);

    try {
        let vms = await computeClient.virtualMachines.listAll();
        done(context, 200, vms);
        // var instanceViews = mvs.map(vm => {
        //     var filterRG = new RegExp('\/subscriptions\/.+?\/resourceGroups\/(.+?)\/.*?$');
        //     filtered = filterRG.exec(vm.id);
        //     var resourceGroup = filtered[1];
        //     result = {
        //         resourceGroup: resourceGroup,
        //         name: vm.name
        //     }
        //     return result;
    
        //     // yield instanceView = computeClient.virtualMachines.instanceView(resourceGroup, item.name);
        //     // return instanceView;
        // });
        // done(context, 200, instanceViews);
    }
    catch (err) {
        doneWithError(context, err);
    }
}

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    status = 400;
    body = "Something is wrong. :(";

    subscriptionId = process.env['subscriptionId'];

    msRestAzure.loginWithAppServiceMSI()
        .then(credentials => {
            getVirtualMachinesRunning(context, credentials, subscriptionId);
        })
        .catch(err => {
            doneWithError(context, err);
        });
};