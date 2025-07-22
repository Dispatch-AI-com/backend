pipeline {
    agent {
        kubernetes {
            cloud 'EKS-Agent-UAT-lawrence'
            yamlFile 'jenkins-agent-uat.yaml'
        }
    }

    environment {
        ENVIRONMENT = "uat"
        AWS_ACCOUNT_ID = "893774231297"
        AWS_REGION = "ap-southeast-2"
        ECR_REPO = "dispatchai-backend"
        IMAGE_NAME = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
        IMAGE_TAG = "uat-${env.BUILD_ID}"
        NODE_ENV = 'uat'
    }

    stages {
        stage('Clean workspace') {
            steps { cleanWs() }
        }

        stage('checkout repos') {
            steps {
                container('node') {
                    dir('backend') {
                        git branch: "${env.BRANCH_NAME}", credentialsId: '2c8f4c5f-0bc2-48ee-b820-f107d08db968', url: 'https://github.com/Dispatch-AI-com/backend.git'
                    }
                }
                container('dispatchai-jenkins-agent') {
                    dir('helm') {
                        git branch: "main", credentialsId: '2c8f4c5f-0bc2-48ee-b820-f107d08db968', url: 'https://github.com/Dispatch-AI-com/helm.git'
                    }
                }
            }
        }

        stage('install, test and build') {
            steps {
                container('node') {
                    dir('backend') {
                        sh "npm install -g pnpm"
                        sh "pnpm install --frozen-lockfile"
                        sh "pnpm run type-check"
                        sh "pnpm run lint"
                        sh "pnpm run build"
                    }
                }
            }
        }

        stage('build docker image') {
            steps {
                container('dispatchai-jenkins-agent') {
                    dir('backend') {
                        script {
                            // Use BuildKit to build docker image and push to ECR
                            sh """
                                docker-credential-ecr-login list
                                buildctl --addr=tcp://localhost:1234 build \\
                                --frontend=dockerfile.v0 \\
                                --local context=. \\
                                --local dockerfile=. \\
                                --opt filename=Dockerfile.uat \\
                                --output type=image,name=${IMAGE_NAME}:${IMAGE_TAG},push=true
                            """
                        }
                    }
                }
            }
        }

        stage('helm to deploy backend') {
            steps {
                container('dispatchai-jenkins-agent') {
                    dir('helm/envs/uat') {
                        script {
                            // deploy to eks via bash
                            sh "bash deploy-backend-api-${ENVIRONMENT}.sh ${IMAGE_TAG}"
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Backend has been deployed successfully with image: ${IMAGE_NAME}:${IMAGE_TAG}"
            emailext(
                to: "lin.lu.devoops@gmail.com",
                subject: "✅ DispatchAI Backend pipeline succeeded.",
                body: "Jenkins CICD Pipeline succeeded!<br/>" +
                    "Job Result: ${currentBuild.currentResult}<br/>" +
                    "Job Name: ${env.JOB_NAME}<br/>" +
                    "Branch: ${env.BRANCH_NAME}<br/>" +
                    "Build Number: ${env.BUILD_NUMBER}<br/>" +
                    "URL: ${env.BUILD_URL}<br/>" +
                    "Image: ${IMAGE_NAME}:${IMAGE_TAG}<br/>",
                attachLog: false
            )
        }

        failure {
            emailext(
                to: "lin.lu.devoops@gmail.com",
                subject: "❌ DispatchAI Backend pipeline failed.",
                body: "Jenkins CICD Pipeline failed!<br/>" +
                    "Job Result: ${currentBuild.currentResult}<br/>" +
                    "Job Name: ${env.JOB_NAME}<br/>" +
                    "Branch: ${env.BRANCH_NAME}<br/>" +
                    "Build Number: ${env.BUILD_NUMBER}<br/>" +
                    "URL: ${env.BUILD_URL}<br/>" +
                    "Please check logfile for more details.<br/>",
                attachLog: false
            )
        }
    }
}
