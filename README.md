
Azure Functions samples for nodejs
====

How to prepare
====

Create an Azure Function
----

First, create an Azure Function. In here I used local git, but you can use another way to deploy code to Azure Functions.

```bash
# Set environment variables
GROUP=<your resource group name>
LOCATION=japaneast

# Create resources on Azure
az group create --name ${GROUP} --location ${LOCATION}
az storage account create --resource-group ${GROUP} --location ${LOCATION}  --name ${GROUP} --sku Standard_LRS
az functionapp create --resource-group ${GROUP} --consumption-plan-location ${LOCATION} --name ${GROUP}func --storage-account ${GROUP} --deployment-local-git
```

How to use this samples
====

Prepare
----

A `get-running-vms` function is a sample to use `identity` in Azure Function.

- [Managed Service Identity in App Service and Azure Functions | Microsoft Docs](https://docs.microsoft.com/en-us/azure/app-service/app-service-managed-service-identity)

If you want to the function, you should do following instructions.

```bash
# Set environment variables to the Azure Function
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
az functionapp config appsettings set --resource-group ${GROUP} --name ${GROUP}func --settings AZURE_SUBSCRIPTION_ID=${SUBSCRIPTION_ID} FUNCTIONS_EXTENSION_VERSION=beta

# Assign an identity to the Azure Function
az functionapp identity assign --resource-group ${GROUP} --name ${GROUP}func
SP_ID=$(az resource list --name ${GROUP}func --query [*].identity.principalId --output tsv)

# Create role assignment to read-only access to a resource
# This is a sample to create role assignment to a virtual machine. In fact, please set your desiring resource's id.
TARGET_RESOURCE_GROUP_NAME=<resource group name>
TARGET_VM_NAME=<virtual machine name>
az role assignment create --assignee ${SP_ID} --role 'Reader' --scope /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${TARGET_RESOURCE_GROUP_NAME}/providers/Microsoft.Compute/virtualMachines/${TARGET_VM_NAME}
```

Deploy and check
---

These steps are to deploy from local to Azure Function with using this repository.

```bash
git clone git@github.com:dzeyelid/azurefunc-samples-nodejs.git
cd azurefunc-samples-nodejs

# Set git repository
GIT_REPO=$(az functionapp deployment source config-local-git --resource-group ${GROUP} --name ${GROUP}func --query url --output tsv)
git remote add azurefunc ${GIT_REPO}

# Push functions to the Azure Function
git push -u azurefunc master
<Enter your password for SCM> # see below

# Sample to check the function
FUNC_URL=$(az functionapp show --resource-group ${GROUP} --name ${GROUP}func --query hostNames[0] -o tsv)
curl --header "Accept: application/json" https://${FUNC_URL}/api/get-runnning-vms
```

About credential of Azure function git, refer this document.

- [How to: Configure deployment credentials - Continuous deployment for Azure Functions | Microsoft Docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-continuous-deployment#how-to-configure-deployment-credentials)

### etc

If you run this functions in your local, please setup the `.env` file. (But now the `identity` feature does not work in local..)

```bash
# Create .env file
cp .env.sample .env
sed -i -E "s/^(AZURE_SUBSCRIPTION_ID=).+?$/\1${SUBSCRIPTION_ID}/" .env
```

How to develop new function on local machine
====

Prepare to develop functions on local machine
----

### Version 2.x
```bash
npm install -g azure-functions-core-tools@core
```

### Version 1.x
- azure-functions-core-tools@1.0.09

```bash
npm install -g azure-functions-core-tools@1.0.9
```

Attention:
Currently, the latest version (1.0.10) has an issue. So it is better using an old version.
- [Cannot find module azurefunctions/functions.js in 1.0.10 · Issue #426 · Azure/azure-functions-core-tools](https://github.com/Azure/azure-functions-core-tools/issues/426)

Sample to create a function on local machine
----

```bash
func init
func azure login
func azure subscriptions set <subscripton id>
func azure functionapp fetch-app-settings ${GROUP}func
func azure storage fetch-connection-string ${GROUP}
func new --language JavaScript --template "Http Trigger" --name MyHttpTrigger
```

Tips
----
If you want to access without authentication, modify the `function.json` in your function directory.

```diff:function.json
  {
    "disabled": false,
    "bindings": [
      {
        "authLevel": "function",
        "type": "httpTrigger",
        "direction": "in",
-       "name": "req"
+       "name": "req",
+      "authLevel": "anonymous"
      },
      {
        "type": "http",
        "direction": "out",
        "name": "res"
      }
    ]
  }
```

References
====

- [Create your first function from the Azure CLI | Microsoft Docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function-azure-cli)
- [How to assign an MSI access to an Azure resource, using Azure CLI | Microsoft Docs](https://docs.microsoft.com/en-us/azure/active-directory/managed-service-identity/howto-assign-access-cli)
- [Develop and run Azure functions locally | Microsoft Docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)