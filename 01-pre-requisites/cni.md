## CNI in action 

```
kubectl apply -f multi.yaml

```
### See the ip 
```
ip link show
```

After po creation there will be veth pair created 

```
ip link show
```
### Check network namespace
```
ip netns list 
ip netns exec <namespace> ip link 
```

### Exec into the pod and see that within a pod they share same namespace and are able to communicate over localhost 

```
kubectl exec -it shared-namespace -- sh
wget -qO- http://localhost
```
Also check 
`ip a`

### chaeck namespace for paus econtainer 

```
lsns | grep nginx 
lsns -p 
lsns | grep sleep
```