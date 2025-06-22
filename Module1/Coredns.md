## Core DNS
### CoreDNS pods
```
kubectl get pods -n kube-system -l k8s-app=kube-dns
```
### Core NS config map
```
kubectl -n kube-system get configmap coredns -o yaml
```

### Deploy nginx and service
```
kubectl apply -f nginx.yaml

```
### DNS test pod 
```
kubectl run -it --rm busybox --image=busybox --restart=Never -- sh
nslookup nginx-service

```