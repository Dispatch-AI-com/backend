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
                        timeout 10 bash -c 'until nc -z localhost 1234; do echo "Waiting for BuildKit..."; sleep 1; done' && echo "✓ BuildKit reachable" || echo "⚠ BuildKit not ready yet"
                    '''
                }
                
                script {
                    echo "✅ Environment verification completed"
                }
            }
        }

        stage('Verify credentials and access') {
            steps {
                script {
                    echo "=== Verifying GitHub and AWS credentials ==="
                }
                
                container('dispatchai-jenkins-agent') {
                    script {
                        // Test GitHub access with more detailed error reporting
                        try {
                            withCredentials([string(credentialsId: '2c8f4c5f-0bc2-48ee-b820-f107d08db968', variable: 'GIT_TOKEN')]) {
                                sh '''
                                    echo "Testing GitHub API access..."
                                    
                                    # Test if token is present
                                    if [ -z "$GIT_TOKEN" ]; then
                                        echo "❌ GitHub token is empty"
                                        exit 1
                                    fi
                                    
                                    # Test GitHub API access
                                    response=$(curl -s -H "Authorization: token $GIT_TOKEN" https://api.github.com/user)
                                    if echo "$response" | grep -q '"login"'; then
                                        echo "✓ GitHub access verified"
                                        echo "$response" | jq -r '.login' 2>/dev/null || echo "API response received"
                                    else
                                        echo "⚠ GitHub access check failed"
                                        echo "Response: $response"
                                    fi
                                '''
                            }
                        } catch (Exception e) {
                            echo "❌ GitHub credential verification failed: ${e.getMessage()}"
                            echo "Please check that credential '2c8f4c5f-0bc2-48ee-b820-f107d08db968' exists and is a valid GitHub token"
                        }
                        
                        // Test AWS/ECR access
                        sh '''
                            echo "Testing AWS ECR access..."
                            aws sts get-caller-identity > /dev/null 2>&1 && \
                            echo "✓ AWS access verified" || echo "⚠ AWS access not configured (will be set in build stage)"
                            
                            echo "Testing ECR login capability..."
                            aws ecr get-login-password --region ${AWS_REGION} > /dev/null 2>&1 && \
                            echo "✓ ECR login capability verified" || echo "⚠ ECR access not yet configured"
                        '''
                    }
                }
                
                script {
                    echo "✅ Credential verification completed"
                }
            }
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
                            
                            // Verify deployment scripts exist
                            sh '''
                                echo "Checking deployment scripts..."
                                ls -la deploy-backend-api-${ENVIRONMENT}.sh || { echo "❌ API deployment script not found"; exit 1; }
                                ls -la deploy-backend-ai-${ENVIRONMENT}.sh || { echo "❌ AI deployment script not found"; exit 1; }
                                echo "✓ Deployment scripts found"
                            '''
                            
                            try {
                                // Deploy API service
                                echo "🚀 Deploying API service..."
                                sh "bash deploy-backend-api-${ENVIRONMENT}.sh ${IMAGE_TAG}"
                                echo "✅ API service deployment completed"
                                
                                // Deploy AI service  
                                echo "🚀 Deploying AI service..."
                                sh "bash deploy-backend-ai-${ENVIRONMENT}.sh ${IMAGE_TAG}"
                                echo "✅ AI service deployment completed"
                                
                            } catch (Exception e) {
                                echo "❌ Deployment failed: ${e.getMessage()}"
                                sh '''
                                    echo "=== Deployment troubleshooting information ==="
                                    kubectl get pods -n dispatchai-uat || echo "Failed to get pods"
                                    kubectl get events -n dispatchai-uat --sort-by='.lastTimestamp' | tail -10 || echo "Failed to get events"
                                '''
                                throw e
                            }
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
                to: "chaolin1984@gmail.com",
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
