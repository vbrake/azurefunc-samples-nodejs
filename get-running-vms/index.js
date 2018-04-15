const rp = require('request-promise');
const msRestAzure  = require("ms-rest-azure");
const computeManagementClient = require('azure-arm-compute');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    status = 400;
    body = "Something is wrong. :(";

    subscriptionId = process.env['subscriptionId'];

    msRestAzure.loginWithAppServiceMSI()
        .then(function(credencials) {
            const computeClient = new computeManagementClient(credencials, subscriptionId);

            computeClient.virtualMachines.listAll()
                .then(function(res) {
                    status = 200;
                    body = JSON.stringify(res);
                });
        })
        .catch(function(err) {
            context.log('err: ' + err);
            status = 500;
            body = JSON.stringify({'error': err});
        });

    context.res = {
        status: status,
        body: body
    }
    context.done();
};