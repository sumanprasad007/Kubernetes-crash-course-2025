In this file you get to create the USer from scratch and add that to your KUBECONFIG file. 


## Create CSR
openssl genrsa -out saiyam.key 2048
openssl req -new -key saiyam.key -out saiyam.csr -subj "/CN=saiyam/O=group1"

## Sign CSE with Kubernetes CA
cat saiyam.csr | base64 | tr -d '\n'

```
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: saiyam
spec:
  request: BASE64_CSR
  signerName: kubernetes.io/kube-apiserver-client
  usages:
  - client auth
```
Note - change the BASE64_CSR with output of above command.

## Apply the CSR, approve it and then get the approve certificate
```
kubectl apply -f csr.yaml
kubectl certificate approve saiyam

kubectl get csr saiyam -o jsonpath='{.status.certificate}' | base64 --decode > saiyam.crt
```

## Create Role and role binding
```
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: saiyam
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```
### setup kubeconfig
```
kubectl config set-credentials saiyam --client-certificate=saiyam.crt --client-key=saiyam.key
kubectl config get-contexts
kubectl config set-context saiyam-context --cluster=kubernetes --namespace=default --user=saiyam
kubectl config use-context saiyam-context
```


### Merging multiple KubeConfig files
export KUBECONFIG=/path/to/first/config:/path/to/second/config:/path/to/third/config

You should be now able to get, list, watch pods in default namepsace once you switch to the new context and nothing else. 

========================================
## Create service account and do direct CURL request to APi server. 

### Create a file deploy.json
``` 
kubectl create deployment nginx --image=nginx --dry-run=client -o json > deploy.json
kubectl run nginx --image=nginx --dry-run=client -o json

```

### SA creation, clusterrolebinding and token creation
```
kubectl create serviceaccount sam --namespace default
kubectl create clusterrolebinding sam-clusteradmin-binding --clusterrole=cluster-admin --serviceaccount=default:sam
kubectl create token sam
TOKEN=outputfromabove
```
### CURL request to the API server. 
```
APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
List deployments
curl -X GET $APISERVER/apis/apps/v1/namespaces/default/deployments -H "Authorization: Bearer $TOKEN" -k
Create Deployment
curl -X POST $APISERVER/apis/apps/v1/namespaces/default/deployments \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @deploy.json \
  -k

List pods 
curl -X GET $APISERVER/api/v1/namespaces/default/pods \
  -H "Authorization: Bearer $TOKEN" \
  -k  
```
