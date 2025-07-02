pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:24.0.6-dind
    command: ["dockerd", "--host=unix:///var/run/docker.sock", "--storage-driver=overlay2"]
    securityContext:
      privileged: true
    resources:
      requests:
        memory: "512Mi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1000m"
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run
    - name: docker-cache
      mountPath: /var/lib/docker
  - name: build-tools
    image: alpine:3.18
    command: ["sleep"]
    args: ["99d"]
    env:
    - name: DOCKER_HOST
      value: unix:///var/run/docker.sock
    - name: AWS_DEFAULT_REGION
      value: ap-southeast-2
    - name: DOCKER_BUILDKIT
      value: "0"
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "1Gi"
        cpu: "500m"
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run
  volumes:
  - name: docker-sock
    emptyDir: {}
  - name: docker-cache
    emptyDir:
      sizeLimit: 10Gi
"""
        }
    }

    environment {
        AWS_REGION = 'ap-southeast-2'
        ECR_REGISTRY = '893774231297.dkr.ecr.ap-southeast-2.amazonaws.com'
        ECR_REPOSITORY = 'dispatchai-backend'
        DOCKERFILE_PATH = 'Dockerfile'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Dispatch-AI-com/backend.git'
            }
        }

        stage('Generate Image Tag') {
            steps {
                container('build-tools') {
                    script {
                        sh '''
                            apk add --no-cache git
                            export GIT_TAG=$(git rev-parse --short HEAD)
                            echo "IMAGE_TAG=${GIT_TAG}" > image_tag.txt
                        '''
                        env.IMAGE_TAG = readFile('image_tag.txt').trim()
                        echo "✅ Using IMAGE_TAG: ${env.IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Build & Push Image') {
            steps {
                container('build-tools') {
                    script {
                        sh '''
                            apk add --no-cache docker-cli aws-cli curl

                            echo "Waiting for Docker daemon to start..."
                            timeout=60
                            while ! docker info >/dev/null 2>&1; do
                                sleep 2
                                timeout=$((timeout-2))
                                if [ $timeout -le 0 ]; then
                                    echo "❌ Docker daemon startup timed out"
                                    exit 1
                                fi
                            done

                            if [ ! -f "${DOCKERFILE_PATH}" ]; then
                                echo "❌ Dockerfile not found at path: ${DOCKERFILE_PATH}"
                                exit 1
                            fi

                            echo "Building image: ${ECR_REPOSITORY}:${IMAGE_TAG}"
                            docker build -f ${DOCKERFILE_PATH} -t ${ECR_REPOSITORY}:${IMAGE_TAG} .

                            echo "Ensuring ECR repo exists..."
                            aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} >/dev/null 2>&1 || \
                                aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}

                            echo "Login to ECR..."
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                            echo "Pushing image to ECR..."
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

                            docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} || true
                            docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest || true

                            echo "✅ Image pushed: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
                        '''
                    }
                }
            }
        }

        stage('Deploy to UAT (Helm)') {
            steps {
                container('build-tools') {
                    sh '''
                        echo "Deploying with Helm..."
                        apk add --no-cache curl tar gzip bash
                        curl -sSL https://get.helm.sh/helm-v3.14.4-linux-amd64.tar.gz | tar -xz
                        mv linux-amd64/helm /usr/local/bin/helm

                        helm upgrade --install backend ./helm/backend \
                          --namespace=uat \
                          --create-namespace \
                          --set image.repository=${ECR_REGISTRY}/${ECR_REPOSITORY} \
                          --set image.tag=${IMAGE_TAG}
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "✅ Jenkins pipeline succeeded"
        }
        failure {
            echo "❌ Jenkins pipeline failed"
        }
    }
}
