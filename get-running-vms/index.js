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
                    var ids = res.map(item => item.id);
                    context.res = {
                        status: 200,
                        body: ids
                    };
                    context.done();
                })
                .catch(function(err) {
                    doneWithError(context, err);
                });
        })
        .catch(function(err) {
            doneWithError(context, err);
        });
};