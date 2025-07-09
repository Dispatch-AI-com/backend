pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: build-tools
    image: node:20-alpine
    command:
    - sleep
    args:
    - 99d
    env:
    - name: DOCKER_HOST
      value: unix:///var/run/docker.sock
    - name: AWS_DEFAULT_REGION
      value: ap-southeast-2
    - name: DOCKER_BUILDKIT
      value: "0"
    volumeMounts:
    - mountPath: /var/run
      name: docker-sock
    - mountPath: /home/jenkins/agent
      name: workspace-volume
      readOnly: false
  - name: docker
    image: docker:24.0.6-dind
    command:
    - dockerd
    - --host=unix:///var/run/docker.sock
    - --storage-driver=overlay2
    - --insecure-registry=localhost:5000
    securityContext:
      privileged: true
    volumeMounts:
    - mountPath: /var/run
      name: docker-sock
    - mountPath: /var/lib/docker
      name: docker-cache
    - mountPath: /home/jenkins/agent
      name: workspace-volume
      readOnly: false
  volumes:
  - name: docker-sock
    emptyDir: {}
  - name: docker-cache
    emptyDir:
      sizeLimit: 10Gi
  - name: workspace-volume
    emptyDir: {}
"""
        }
    }
    
    environment {
        ECR_REGISTRY = "893774231297.dkr.ecr.ap-southeast-2.amazonaws.com"
        IMAGE_NAME = "dispatchai-backend"
        AWS_DEFAULT_REGION = "ap-southeast-2"
    }
    
    stages {
        stage('检出代码') {
            steps {
                git branch: 'main', url: 'https://github.com/Dispatch-AI-com/backend.git'
            }
        }
        
        stage('安装依赖和构建') {
            steps {
                container('build-tools') {
                    script {
                        sh '''
                            echo "=== 开始安装依赖和构建 ==="
                            
                            # 安装pnpm
                            npm install -g pnpm
                            
                            # 显示环境信息
                            echo "Node版本: $(node --version)"
                            echo "pnpm版本: $(pnpm --version)"
                            
                            # 安装依赖
                            echo "开始安装依赖..."
                            pnpm install
                            
                            # 构建应用
                            echo "开始构建应用..."
                            pnpm run build
                            
                            # 验证构建结果
                            echo "验证构建结果..."
                            if [ -d "dist" ]; then
                                echo "✅ dist目录创建成功"
                                ls -la dist/
                            else
                                echo "❌ dist目录不存在，构建失败"
                                exit 1
                            fi
                            
                            echo "=== 构建完成 ==="
                        '''
                    }
                }
            }
        }
        
        stage('构建和推送Docker镜像') {
            steps {
                container('build-tools') {
                    script {
                        sh '''
                            echo "=== 开始Docker镜像构建 ==="
                            
                            # 安装必要工具
                            apk update
                            apk add --no-cache aws-cli docker-cli curl
                            
                            # 设置Docker BuildKit
                            export DOCKER_BUILDKIT=0
                            
                            # 等待Docker daemon
                            echo "等待Docker daemon启动..."
                            timeout=60
                            until docker info; do
                                sleep 1
                                timeout=$((timeout-1))
                                if [ $timeout -eq 0 ]; then
                                    echo "❌ Docker daemon启动超时"
                                    exit 1
                                fi
                            done
                            echo "✅ Docker daemon已就绪"
                            
                            # 验证Dockerfile
                            if [ ! -f Dockerfile.uat ]; then
                                echo "❌ Dockerfile.uat文件不存在！"
                                exit 1
                            fi
                            
                            # 构建Docker镜像
                            echo "开始构建Docker镜像..."
                            IMAGE_TAG="${ECR_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}"
                            DOCKER_BUILDKIT=0 docker build --no-cache -f Dockerfile.uat -t ${IMAGE_TAG} .
                            
                            if [ $? -eq 0 ]; then
                                echo "✅ Docker镜像构建成功: ${IMAGE_TAG}"
                            else
                                echo "❌ Docker镜像构建失败"
                                exit 1
                            fi
                            
                            # 登录ECR
                            echo "登录ECR..."
                            aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                            
                            # 推送到ECR
                            echo "推送镜像到ECR..."
                            docker push ${IMAGE_TAG}
                            
                            if [ $? -eq 0 ]; then
                                echo "✅ 镜像推送成功: ${IMAGE_TAG}"
                            else
                                echo "❌ 镜像推送失败"
                                exit 1
                            fi
                            
                            echo "=== Docker镜像构建和推送完成 ==="
                        '''
                    }
                }
            }
        }
        
        stage('安全扫描') {
            steps {
                echo "运行安全扫描..."
                // 在这里添加你的安全扫描逻辑
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            echo "❌ 流水线执行失败，请检查日志"
        }
        success {
            echo "✅ 流水线执行成功，镜像已推送到ECR"
        }
    }
}