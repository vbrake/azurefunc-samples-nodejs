const rp = require('request-promise');
const msRestAzure  = require("ms-rest-azure");
const computeManagementClient = require('azure-arm-compute');

function doneWithError(context, err) {
    context.log('err: ' + err);
    context.res = {
        status: 500,
        body: {error: err}
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

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var status = 400;
    var body = "Something is wrong. :(";

    var subscriptionId = process.env['AZURE_SUBSCRIPTION_ID'];
    var computeClient = null;

    msRestAzure.loginWithAppServiceMSI()
        .then(credentials => {
            computeClient = new computeManagementClient(credentials, subscriptionId);
            return computeClient.virtualMachines.listAll();
        })
        .then(vms => {
            done(context, 200, {vms: vms});
        })
        .catch(err => {
            doneWithError(context, err);
        });
};