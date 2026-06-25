pipeline {
    agent any

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
                sh '''
                    cd backend
                    pm2 stop heartspace-backend || true
                    pm2 start server.js --name heartspace-backend
                '''
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
