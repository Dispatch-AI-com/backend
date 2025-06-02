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
                    echo "🧹 Cleaning up local Docker images..."

                    docker rmi ${IMAGE_NAME} || echo "⚠️ Local image not found: ${IMAGE_NAME}"
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
