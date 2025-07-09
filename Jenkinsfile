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
    command:
    - dockerd
    - --host=unix:///var/run/docker.sock
    - --storage-driver=overlay2
    - --insecure-registry=localhost:5000
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
        ECR_REGISTRY = '893774231297.dkr.ecr.ap-southeast-2.amazonaws.com'
        ECR_REPOSITORY = 'dispatchai-backend'
        IMAGE_TAG = "${BUILD_NUMBER}"
        AWS_REGION = 'ap-southeast-2'
    }
    
    stages {
        stage('检出代码') {
            steps {
                git branch: 'main', url: 'https://github.com/Dispatch-AI-com/backend.git'
            }
        }
        
        stage('构建和推送') {
            steps {
                container('build-tools') {
                    script {
                        try {
                            sh '''
                                # 安装必要工具
                                apk update && apk add --no-cache aws-cli docker-cli curl
                                
                                # 禁用BuildKit避免buildx依赖问题
                                export DOCKER_BUILDKIT=0
                                
                                # 等待Docker daemon就绪
                                echo "等待Docker daemon启动..."
                                timeout=60
                                while ! docker info >/dev/null 2>&1; do
                                    sleep 2
                                    timeout=$((timeout-2))
                                    if [ $timeout -le 0 ]; then
                                        echo "Docker daemon启动超时"
                                        exit 1
                                    fi
                                done
                                echo "Docker daemon已就绪"
                                
                                # 检查Dockerfile是否存在
                                if [ ! -f "Dockerfile" ]; then
                                    echo "错误: Dockerfile不存在"
                                    exit 1
                                fi
                                
                                # 构建镜像
                                echo "开始构建镜像..."
                                DOCKER_BUILDKIT=0 docker build --no-cache -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
                                
                                # 确保ECR仓库存在
                                echo "检查ECR仓库是否存在..."
                                if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} >/dev/null 2>&1; then
                                    echo "创建ECR仓库: ${ECR_REPOSITORY}"
                                    aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}
                                else
                                    echo "ECR仓库已存在: ${ECR_REPOSITORY}"
                                fi
                                
                                # ECR登录
                                echo "登录ECR..."
                                aws ecr get-login-password --region ${AWS_REGION} | \\
                                docker login --username AWS --password-stdin ${ECR_REGISTRY}
                                
                                # 标记和推送镜像
                                echo "标记并推送镜像..."
                                docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                                
                                docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                                
                                # 清理本地镜像以节省空间
                                docker rmi ${ECR_REPOSITORY}:${IMAGE_TAG} || true
                                docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} || true
                                docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest || true
                                
                                echo "构建和推送完成!"
                                echo "镜像: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
                            '''
                        } catch (Exception e) {
                            echo "构建失败: ${e.getMessage()}"
                            throw e
                        }
                    }
                }
            }
        }
        
        stage('安全扫描') {
            steps {
                container('build-tools') {
                    sh '''
                        # 可选: 添加镜像安全扫描
                        echo "镜像安全扫描可以在这里实现"
                        # 例如使用 Trivy 或 Clair
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // 清理工作空间
            cleanWs()
        }
        success {
            echo "流水线执行成功! 镜像已推送到: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
        }
        failure {
            echo "流水线执行失败，请检查日志"
        }
    }
}