# Kubernetes Course 2025

Welcome to the Kubernetes Crash Course, a practical, hands-on journey that takes you from the basics to a fully functional microservices architecture on Kubernetes — absolutely free 🎉.

Thanks to our **partner [Exoscale](https://portal.exoscale.com/register?coupon=KUBE_CRASH_COURSE_ON_SKS)**, this course is available for everyone without any cost. 🙌 The best part is that Exoscale is giving away free 50.00 CHF so that not only you can learn but also practice on a cloud provider for FREE. Click the image below to access FREE credits.
[![exoscale-RGB-logo-fullcolor-whiteBG](https://github.com/user-attachments/assets/1abe9523-d43c-4a7f-9104-26705595df1b)](https://portal.exoscale.com/register?coupon=KUBE_CRASH_COURSE_ON_SKS)

---
## ▶️ Watch the Full Course on YouTube

[![kubernetes logo ](https://github.com/user-attachments/assets/178204c0-7469-435d-86a0-011fd94bdca3)](https://youtu.be/EV47Oxwet6Y)

---

## 🧠 What You’ll Learn

This course goes beyond theory and focuses on **real-world Kubernetes setups** for cloud-native applications. Every major Kubernetes concept is backed by demos, with each section organized in dedicated folders.

### 🔁 Main App Flow Demo (Steps)
0. **Buildindg Docker images of the applications**
This step is to build the container images for the application.

```
docker buildx build --platform linux/amd64 --tag ttl.sh/game-service:v1 --push ./game-service
docker buildx build --platform linux/amd64 --tag ttl.sh/auth-service:v1 --push ./auth-service
docker buildx build --platform linux/amd64 --tag ttl.sh/frontend:v1 --push ./frontend
```

1. **Deploy Core Microservices**  
   - `auth-service`, `frontend`, and `game-service`

```
kubectl apply -f manifests/auth-deploy.yaml
kubectl apply -f manifests/game-deploy.yaml
kubectl apply -f manifests/frontend.yaml
```

2. **Expose with Kubernetes Services**  
   - Internal service communication and external access
```
kubectl apply -f manifests/auth-service.yaml
kubectl apply -f manifests/game-service.yaml
kubectl apply -f manifests/frontend-service.yaml
```

3. **Database Setup with CloudNativePG**  
   - Install CNPF and create a postgress cluster using `pgcluster` CRD

CNPG Install

```
kubectl apply --server-side -f \
  https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.25/releases/cnpg-1.25.2.yaml
```

Initial config map

```
 kubectl create configmap init-sql \                                      
  --from-file=init.sql=./init.sql \
  -n crash-course
```

Cluster creation

```
kubectl apply -f pgcluster.yaml
```

4. **Secure with HTTPS & Gateway API**  
   - Install `cert-manager`  
   - Enable Gateway API in your deployments  
   - Install and configure `kGateway`  
   - Create `Gateway`, `CertificateIssuer`, and `HTTPRoute`
Cert Manager 
```
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.18.0/cert-manager.yaml
```
Edit deployment and add enable gateway API 

```
kubectl edit deploy cert-manager -n cert-manager
```
add `- --enable-gateway-api`
Restart cert-manager
```
kubectl rollout restart deployment cert-manager -n cert-manager
```
Install kgateway 
```
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.1/standard-install.yaml

helm upgrade -i --create-namespace --namespace kgateway-system --version v2.0.1 kgateway-crds oci://cr.kgateway.dev/kgateway-dev/charts/kgateway-crds

helm upgrade -i --namespace kgateway-system --version v2.0.1 kgateway oci://cr.kgateway.dev/kgateway-dev/charts/kgateway

```
Apply manifests 

```
kubectl apply -f manifests/cluster-issuer.yaml
kubectl apply -f manifests/gateway.yaml
kubectl apply -f manifests/httproute.yaml
kubectl apply -f manifests/httpredirect.yaml
```
5. **Monitor with kube-prometheus-stack**  
   - Get real-time metrics in **Grafana**, using a production-grade monitoring stack
Install Kube prometheus stack
```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring
```


---

## 📁 Repository Structure

Each folder corresponds to a major topic covered in the course:

- `auth-service`, `frontend`, `game-service`: Microservices
- `configmaps`, `volumes`, `rbac`, `pods`: Core Kubernetes objects
- `scheduler`: Custom scheduling demos
- `services`, `deployments`, `manifests`: Resource definitions
- `Module1`: Intro module to Kubernetes
- `init.sql`: Database initialization

---

## 🤝 Special Thanks to Exoscale
Join their [slack](https://join.slack.com/t/exoscale-org/shared_invite/zt-34s6jetvl-tNP_TpfweeAKNnPb593j9A) today(where you can ask anything about Kubernetes and this course).
[![exoscale-RGB-logo-fullcolor-whiteBG](https://github.com/user-attachments/assets/74746c0f-a653-4e64-b963-a0579e3486c8)](https://join.slack.com/t/exoscale-org/shared_invite/zt-34s6jetvl-tNP_TpfweeAKNnPb593j9A)

Big shoutout to **[Exoscale](https://www.exoscale.com/)** for **partnering on this course**. Their cloud-native focus and developer-first platform made it possible to create this educational series for free.

👉 **Explore Exoscale**: https://www.exoscale.com/

---

## ⭐ Support the Project

If this repo or course helped you:

- ⭐ Star the repo  
- 📣 Share the course with your friends  
- 🐦 Tag us on Twitter/X [@kubesimplify](https://twitter.com/kubesimplify)

Let’s make Kubernetes easy and fun for everyone 🚀
