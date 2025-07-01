// getEnvironmentConfig function to set environment variables
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
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKERFILE_PATH = 'Dockerfile'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Dispatch-AI-com/backend.git'
            }
        }

        stage('Build & Push Image') {
            steps {
                container('build-tools') {
                    script {
                        try {
                            sh '''
                                apk update && apk add --no-cache aws-cli docker-cli curl

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

                                echo "Building Docker image..."
                                docker build -f ${DOCKERFILE_PATH} -t ${ECR_REPOSITORY}:${IMAGE_TAG} .

                                echo "Ensuring ECR repository exists..."
                                if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} >/dev/null 2>&1; then
                                    aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}
                                fi

                                echo "Logging in to AWS ECR..."
                                aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                                echo "Tagging and pushing image..."
                                docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                                docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                                docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                                docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

                                docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} || true
                                docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest || true

                                echo "✅ Image successfully built and pushed: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
                            '''
                        } catch (e) {
                            echo "❌ Image build failed: ${e.getMessage()}"
                            throw e
                        }
                    }
                }
            }
        }

        stage('Deploy to UAT (Helm)') {
            steps {
                container('build-tools') {
                    sh '''
                        echo "Deploying to UAT via Helm..."
                        apk add --no-cache bash curl tar gzip
                        curl -sSL https://get.helm.sh/helm-v3.14.4-linux-amd64.tar.gz | tar -xz
                        mv linux-amd64/helm /usr/local/bin/helm

                        helm version

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
            mail to: 'fanhang995@gmail.com',
                 subject: "✅ Jenkins Pipeline Success - Build #${BUILD_NUMBER}",
                 body: "Image was successfully built and deployed.\n\nImage: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}\nBuild: ${env.BUILD_URL}"
        }
        failure {
            mail to: 'fanhang995@gmail.com',
                 subject: "❌ Jenkins Pipeline Failed - Build #${BUILD_NUMBER}",
                 body: "Pipeline failed. Please review the logs at:\n\n${env.BUILD_URL}"
        }
    }
}
