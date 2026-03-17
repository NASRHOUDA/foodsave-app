pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io/houdanasr'
        GITOPS_REPO = 'https://github.com/NASRHOUDA/foodsave-gitops.git'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Test') {
            steps {
                echo 'Tests will be added later'
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build user-service') {
                    steps {
                        dir('user-service') {
                            script {
                                docker.build("${DOCKER_REGISTRY}/foodsave-user:${BUILD_NUMBER}")
                            }
                        }
                    }
                }
                stage('Build donation-service') {
                    steps {
                        dir('donation-service') {
                            script {
                                docker.build("${DOCKER_REGISTRY}/foodsave-donation:${BUILD_NUMBER}")
                            }
                        }
                    }
                }
                stage('Build notification-service') {
                    steps {
                        dir('notification-service') {
                            script {
                                docker.build("${DOCKER_REGISTRY}/foodsave-notification:${BUILD_NUMBER}")
                            }
                        }
                    }
                }
                stage('Build matching-service') {
                    steps {
                        dir('matching-service') {
                            script {
                                docker.build("${DOCKER_REGISTRY}/foodsave-matching:${BUILD_NUMBER}")
                            }
                        }
                    }
                }
                stage('Build frontend') {
                    steps {
                        dir('foodsave-frontend') {
                            script {
                                docker.build("${DOCKER_REGISTRY}/foodsave-frontend:${BUILD_NUMBER}")
                            }
                        }
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    docker.withRegistry('', 'docker-hub') {
                        def images = [
                            'foodsave-user',
                            'foodsave-donation',
                            'foodsave-notification',
                            'foodsave-matching',
                            'foodsave-frontend'
                        ]
                        images.each { img ->
                            docker.image("${DOCKER_REGISTRY}/${img}:${BUILD_NUMBER}").push()
                            docker.image("${DOCKER_REGISTRY}/${img}:${BUILD_NUMBER}").push('latest')
                        }
                    }
                }
            }
        }
        
        stage('Update GitOps') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github_token', variable: 'GITHUB_TOKEN')]) {
                        sh """
                            git clone https://NASRHOUDA:${GITHUB_TOKEN}@github.com/NASRHOUDA/foodsave-gitops.git gitops
                            cd gitops/kubernetes
                            
                            for service in user-service donation-service notification-service matching-service frontend; do
                                if [ -f \${service}/deployment.yaml ]; then
                                    sed -i "s|image:.*|image: ${DOCKER_REGISTRY}/foodsave-\${service}:${BUILD_NUMBER}|g" \${service}/deployment.yaml
                                fi
                            done
                            
                            git config user.email "jenkins@foodsave.com"
                            git config user.name "Jenkins CI"
                            git add .
                            git commit -m "Update all services to build ${BUILD_NUMBER}"
                            git push
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
