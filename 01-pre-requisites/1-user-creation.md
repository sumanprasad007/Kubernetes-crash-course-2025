In this file you get to create the USer from scratch and add that to your KUBECONFIG file. 


## Create CSR
openssl genrsa -out prasad.key 2048
openssl req -new -key prasad.key -out prasad.csr -subj "/CN=prasad/O=group1"

## Sign CSE with Kubernetes CA
cat prasad.csr | bas364 | tr -d '\n'

```
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: prasad
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
kubectl certificate approve prasad

kubectl get csr prasad -o jsonpath='{.status.certificate}' | base64 --decode > prasad.crt
```

## Create Role and role binding
```
cat <<EOF > role.yaml

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
  name: prasad
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
  
EOF

kubectl apply -f role.yaml
```
### setup kubeconfig
```
kubectl config set-credentials prasad --client-certificate=prasad.crt --client-key=prasad.key
kubectl config get-contexts
kubectl config set-context prasad-context --cluster=kubernetes --namespace=default --user=prasad
kubectl config use-context prasad-context
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

### SA creation, cluster-admin is default clusterrole in k8s, clusterrolebinding and token creation [Imperative way]
```
kubectl create serviceaccount sam --namespace default
kubectl create clusterrolebinding sam-clusteradmin-binding --clusterrole=cluster-admin --serviceaccount=default:sam

# required token of SA to talk to API server, let's create it
kubectl create token sam
TOKEN=outputfromabove
```
### CURL request to the API server. 
```
APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
# List deployments
curl -X GET $APISERVER/apis/apps/v1/namespaces/default/deployments -H "Authorization: Bearer $TOKEN" -k
# Create Deployment
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
