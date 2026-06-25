pipeline {
    agent any

    environment {
        APP_SERVER = '15.206.209.221'
        APP_DIR = '/home/ubuntu/heartspace'
    }

    stages {
        stage('Clone Repository') {
            steps {
                echo 'Cloning HeartSpace repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing backend dependencies...'
                sh 'cd backend && npm install'
            }
        }

        stage('Deploy to App Server') {
            steps {
                echo 'Deploying HeartSpace to app server...'
                sshagent(['app-server-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@${APP_SERVER} "
                            mkdir -p ${APP_DIR}
                        "
                        scp -o StrictHostKeyChecking=no -r backend/* ubuntu@${APP_SERVER}:${APP_DIR}/
                        scp -o StrictHostKeyChecking=no frontend/index.html ubuntu@${APP_SERVER}:${APP_DIR}/
                        ssh -o StrictHostKeyChecking=no ubuntu@${APP_SERVER} "
                            cd ${APP_DIR} &&
                            npm install &&
                            pm2 stop heartspace-backend || true &&
                            pm2 start server.js --name heartspace-backend &&
                            pm2 save
                        "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'HeartSpace deployed successfully! 💕'
        }
        failure {
            echo 'Deployment failed. Check logs!'
        }
    }
}
