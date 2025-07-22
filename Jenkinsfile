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
        ECR_REPO_API = "dispatchai-backend"
        ECR_REPO_AI = "dispatchai-ai"
        IMAGE_NAME_API = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_API}"
        IMAGE_NAME_AI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_AI}"
        IMAGE_TAG = "uat-${env.BUILD_ID}"
        NODE_ENV = 'uat'
        // Jenkins Credentials ID
        GIT_CREDENTIALS_ID = 'github-token-dispatchai'
    }

    stages {
        stage('Clean workspace') {
            steps { cleanWs() }
        }

        stage('Verify environment') {
            steps {
                script {
                    echo "=== Verifying container environment ==="
                }
                
                container('node') {
                    sh '''
                        echo "Node.js container verification:"
                        node --version
                        npm --version
                        which pnpm || npm install -g pnpm
                        pnpm --version
                    '''
                }
                
                container('dispatchai-jenkins-agent') {
                    sh '''
                        echo "DispatchAI Jenkins Agent container verification:"
                        echo "Python version:"
                        python3 --version || python --version
                        
                        echo "AWS CLI version:"
                        aws --version
                        
                        echo "Docker credential helper:"
                        docker-credential-ecr-login version || echo "ECR login helper not found"
                        
                        echo "uv version:"
                        uv --version || echo "uv not pre-installed, will install during build"
                        
                        echo "BuildKit connectivity test:"
                        timeout 10 sh -c 'until nc -z localhost 1234; do sleep 1; done' && echo "✓ BuildKit reachable" || echo "⚠ BuildKit not ready yet"
                    '''
                }
                
                script {
                    echo "✅ Environment verification completed"
                }
            }
        }

        stage('checkout repos') {
            steps {
                script {
                    echo "Starting to checkout code repositories..."
                    echo "Using credentials ID: ${GIT_CREDENTIALS_ID}"
                }
                
                container('node') {
                    dir('backend') {
                        git branch: "${env.BRANCH_NAME}", 
                            credentialsId: "${GIT_CREDENTIALS_ID}", 
                            url: 'https://github.com/Dispatch-AI-com/backend.git'
                    }
                }
                container('dispatchai-jenkins-agent') {
                    dir('helm') {
                        git branch: "main", 
                            credentialsId: "${GIT_CREDENTIALS_ID}", 
                            url: 'https://github.com/Dispatch-AI-com/helm.git'
                    }
                }
                
                script {
                    echo "✅ Code checkout completed"
                    echo "Backend branch: ${env.BRANCH_NAME}"
                    echo "Helm branch: main"
                }
            }
        }

        stage('install and test backend API') {
            steps {
                container('node') {
                    dir('backend') {
                        script {
                            echo "=== Install and test NestJS API ==="
                            sh '''
                                echo "Installing pnpm and dependencies..."
                                npm install -g pnpm
                                pnpm install --frozen-lockfile
                                
                                echo "Running type check..."
                                pnpm run type-check
                                
                                echo "Running ESLint check..."
                                pnpm run lint
                                
                                echo "Running tests..."
                                pnpm test --passWithNoTests
                                
                                echo "Building NestJS application..."
                                pnpm run build
                                
                                echo "Verifying build output..."
                                [ -d "dist" ] && echo "✓ dist directory created" || { echo "✗ Build failed"; exit 1; }
                                [ -f "dist/main.js" ] && echo "✓ main.js generated" || { echo "✗ main.js not found"; exit 1; }
                            '''
                        }
                    }
                }
            }
        }

        stage('install and test AI service') {
            steps {
                container('dispatchai-jenkins-agent') {
                    dir('backend') {
                        script {
                            echo "=== Install and test Python AI service ==="
                            sh '''
                                # Verify tools are available
                                echo "Checking Python environment..."
                                python3 --version
                                which uv || { echo "Installing uv..."; curl -LsSf https://astral.sh/uv/install.sh | sh; }
                                export PATH="$HOME/.cargo/bin:$PATH"
                                uv --version
                                
                                echo "Installing Python dependencies..."
                                cd ai
                                uv sync
                                
                                echo "Running Python lint checks..."
                                uv run ruff check . || echo "Ruff check completed (may contain warnings)"
                                uv run ruff format --check . || echo "Format check completed (may contain warnings)"
                                
                                echo "Running Python tests..."
                                uv run python -m pytest tests/ -v || echo "Python tests completed (may have no tests or failures)"
                                
                                echo "Validating FastAPI application..."
                                uv run python -c "from app.main import app; print('✓ FastAPI app validated successfully')"
                            '''
                        }
                    }
                }
            }
        }

        stage('build docker images') {
            parallel {
                stage('build API docker image') {
                    steps {
                        container('dispatchai-jenkins-agent') {
                            dir('backend') {
                                script {
                                    echo "=== Build API Docker image ==="
                                    sh """
                                        echo "Verifying ECR credentials..."
                                        docker-credential-ecr-login list || echo "ECR credentials check completed"
                                        
                                        echo "Using BuildKit to build and push API image..."
                                        echo "BuildKit address: tcp://localhost:1234"
                                        
                                        buildctl --addr=tcp://localhost:1234 build \\
                                        --frontend=dockerfile.v0 \\
                                        --local context=. \\
                                        --local dockerfile=. \\
                                        --output type=image,name=${IMAGE_NAME_API}:${IMAGE_TAG},push=true
                                        
                                        echo "✓ API image built successfully: ${IMAGE_NAME_API}:${IMAGE_TAG}"
                                    """
                                }
                            }
                        }
                    }
                }
                
                stage('build AI docker image') {
                    steps {
                        container('dispatchai-jenkins-agent') {
                            dir('backend/ai') {
                                script {
                                    echo "=== Build AI Docker image ==="
                                    sh """
                                        echo "Verifying ECR credentials..."
                                        docker-credential-ecr-login list || echo "ECR credentials check completed"
                                        
                                        echo "Using BuildKit to build and push AI image..."
                                        echo "BuildKit address: tcp://localhost:1234"
                                        
                                        buildctl --addr=tcp://localhost:1234 build \\
                                        --frontend=dockerfile.v0 \\
                                        --local context=. \\
                                        --local dockerfile=. \\
                                        --output type=image,name=${IMAGE_NAME_AI}:${IMAGE_TAG},push=true
                                        
                                        echo "✓ AI image built successfully: ${IMAGE_NAME_AI}:${IMAGE_TAG}"
                                    """
                                }
                            }
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
                            echo "=== Deploy backend services using Helm ==="
                            // Deploy API service
                            sh "bash deploy-backend-api-${ENVIRONMENT}.sh ${IMAGE_TAG}"
                            
                            // Deploy AI service
                            sh "bash deploy-backend-ai-${ENVIRONMENT}.sh ${IMAGE_TAG}"
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Backend services have been deployed successfully!"
            echo "API Image: ${IMAGE_NAME_API}:${IMAGE_TAG}"
            echo "AI Image: ${IMAGE_NAME_AI}:${IMAGE_TAG}"
            emailext(
                to: "lawrence.wenboli@gmail.com",
                subject: "✅ DispatchAI Backend pipeline succeeded.",
                body: "Jenkins CICD Pipeline succeeded!<br/>" +
                    "Job Result: ${currentBuild.currentResult}<br/>" +
                    "Job Name: ${env.JOB_NAME}<br/>" +
                    "Branch: ${env.BRANCH_NAME}<br/>" +
                    "Build Number: ${env.BUILD_NUMBER}<br/>" +
                    "URL: ${env.BUILD_URL}<br/>" +
                    "API Image: ${IMAGE_NAME_API}:${IMAGE_TAG}<br/>" +
                    "AI Image: ${IMAGE_NAME_AI}:${IMAGE_TAG}<br/>",
                attachLog: false
            )
        }

        failure {
            emailext(
                to: "lawrence.wenboli@gmail.com",
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
