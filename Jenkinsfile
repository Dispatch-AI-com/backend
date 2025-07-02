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