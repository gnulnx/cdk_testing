#build the image
docker build -t cdk_testing:latest .

# Log in to the ECR registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 715930459276.dkr.ecr.us-east-1.amazonaws.com

# Create a repository in ECR if you haven't already
aws ecr create-repository --repository-name your-repo-name --region us-east-1

# Tag your Docker image with the ECR repository URL
docker tag cdk_testing:latest 715930459276.dkr.ecr.us-east-1.amazonaws.com/cdk_testing:latest

# Push the Docker image to ECR
docker push 715930459276.dkr.ecr.us-east-1.amazonaws.com/cdk_testing:latest
