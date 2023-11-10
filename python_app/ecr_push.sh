account_id=241413258911
region=us-east-1
repository_name=jf-test  # Use your repository name here
tag=latest

set -x

docker buildx create --use
docker buildx build --platform linux/amd64 -t $account_id.dkr.ecr.$region.amazonaws.com/$repository_name:$tag .

# Log in to the ECR registry

aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $account_id.dkr.ecr.$region.amazonaws.com

# Tag your Docker image with the ECR repository URL
docker tag cdk_testing:latest $account_id.dkr.ecr.$region.amazonaws.com/$repository_name:latest

# Push the Docker image to ECR
docker push $account_id.dkr.ecr.$region.amazonaws.com/$repository_name:latest

set +x