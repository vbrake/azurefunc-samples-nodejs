require('dotenv').config()
const msRestAzure  = require("ms-rest-azure");
const computeManagementClient = require('azure-arm-compute');
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

getCredentials = () => {
    if (process.env.APPSETTING_WEBSITE_SITE_NAME) {
        return msRestAzure.loginWithAppServiceMSI();
    } else {
        clientId = process.env.AZURE_SP_CLIENT_ID;
        clientSecret = process.env.AZURE_SP_CLIENT_SECRET;
        tenantId = process.env.AZURE_TENANT_ID;
        return msRestAzure.loginWithServicePrincipalSecret(
            clientId,
            clientSecret,
            tenantId)
    }
}

getResourceGroupFromResouceId = (resourceId) => {
    const re = new RegExp('\/subscriptions\/.+?\/resourceGroups\/(.+?)[\/|$]');
    const result = re.exec(resourceId);
    if (result && result[1]) {
        return result[1]
    }
    return '';
}

async function getAllInstanceViews() {
    const credentials = await getCredentials();
    const computeClient = new computeManagementClient(credentials, subscriptionId);
    const vms = await computeClient.virtualMachines.listAll();
    const vmsss = await computeClient.virtualMachineScaleSets.listAll();

    let statusesOfVm = new Promise(async (resolve) => {
        const res = await Promise.all(vms.map(async (vm) => {
            const resourceGroup = getResourceGroupFromResouceId(vm.id);
            if (resourceGroup) {
                const instanceView = await computeClient.virtualMachines.instanceView(
                    resourceGroup, vm.name);
                return {
                    vmName: vm.name,
                    statuses: instanceView.statuses
                };
            }
        }));
        resolve(res);
    });
    let statusesOfVmss = new Promise(async (resolve) => {
        const res = await Promise.all(vmsss.map(async (vmss) => {
            let resourceGroup = getResourceGroupFromResouceId(vmss.id);
            if (resourceGroup) {
                const vmssvms = await computeClient.virtualMachineScaleSetVMs.list(
                    resourceGroup, vmss.name);
                return await Promise.all(vmssvms.map(async (vm) => {
                    const instanceView = await computeClient.virtualMachineScaleSetVMs.getInstanceView(
                        resourceGroup, vmss.name, vm.instanceId);
                    return {
                        vmName: vm.name,
                        statuses: instanceView.statuses
                    };
                }));
            }
        }));
        resolve(res);
    });

    const allInstanceViews = await Promise.all([
        statusesOfVm,
        statusesOfVmss
    ]);
    return allInstanceViews;
}

module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if(myTimer.isPastDue)
    {
        context.log('JavaScript is running late!');
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);   

    new Promise(resolve => {
        resolve(getAllInstanceViews());
    }).then((values) => {
        context.log(JSON.stringify(values));
        context.done();
    });

};