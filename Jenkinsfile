pipeline {
	agent {
		kubernetes {}
	}
    environment {
        AWS_REGION = 'ap-southeast-2'
        ECR_REPO = 'dispatchai-backend'
        IMAGE_TAG = "${env.BUILD_ID}"
        IMAGE_NAME = "${ECR_REPO}:${IMAGE_TAG}"
        ECR_REGISTRY = "893774231297.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }



    stages {
        stage('Install CLI Tools') {
            steps {
                sh '''
                    set -e

                    echo "🔍 Checking and installing required CLI tools..."

                    # curl
                    if ! command -v curl >/dev/null 2>&1; then
                    echo "⚙️ Installing curl..."
                    sudo apt-get update && apt-get install -y curl
                    else
                    echo "✅ curl already installed."
                    fi

                    # unzip
                    if ! command -v unzip >/dev/null 2>&1; then
                    echo "⚙️ Installing unzip..."
                    sudo apt-get update && apt-get install -y unzip
                    else
                    echo "✅ unzip already installed."
                    fi

                    # python3
                    if ! command -v python3 >/dev/null 2>&1; then
                    echo "⚙️ Installing python3..."
                    sudo apt-get update && apt-get install -y python3
                    else
                    echo "✅ python3 already installed."
                    fi

                    # pip3
                    if ! command -v pip3 >/dev/null 2>&1; then
                    echo "⚙️ Installing pip3..."
                    sudo apt-get update && apt-get install -y python3-pip
                    else
                    echo "✅ pip3 already installed."
                    fi

                    # git
                    if ! command -v git >/dev/null 2>&1; then
                    echo "⚙️ Installing git..."
                    sudo apt-get update && apt-get install -y git
                    else
                    echo "✅ git already installed."
                    fi

                    # awscli
                    if ! command -v aws >/dev/null 2>&1; then
                    echo "⚙️ Installing AWS CLI via pip..."
                    sudo pip3 install awscli
                    else
                    echo "✅ AWS CLI already installed."
                    fi

                    echo "✅ CLI Tools check complete."
                '''
            }
        }

        stage('Checkout') {
            steps {
                script {    
                    cleanWs()
                    sh 'git clone https://github.com/Dispatch-AI-com/backend.git .'
                }     
            }
        }

        stage('Get ECR Login') {
            steps {
                script {
                    // env.ECR_REGISTRY = ECR_REGISTRY

                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${IMAGE_NAME} ."
                    sh "docker tag ${IMAGE_NAME} ${ECR_REGISTRY}/${IMAGE_NAME}"
                }
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    sh "docker push ${ECR_REGISTRY}/${IMAGE_NAME}"
                }
            }
        }

        stage('Clean up Image') {
            steps {
                script {
                    sh """
                    echo "Cleaning up local Docker images..."

                    docker rmi ${IMAGE_NAME} || echo "Local image not found: ${IMAGE_NAME}"
                    docker rmi ${ECR_REGISTRY}/${IMAGE_NAME} || echo "⚠️ Local image not found: ${ECR_REGISTRY}/${IMAGE_NAME}"
                    """
                }
            }
        }

        // stage('Clean all up') {
        //     steps {
        //         sh "docker system prune -af"
        //     }
        // }
    }

    post {
        success {
            echo "✅ Docker image pushed: ${ECR_REGISTRY}/${IMAGE_NAME}"
        }
        failure {
            echo '❌ Pipeline failed.'
        }
    }
}
