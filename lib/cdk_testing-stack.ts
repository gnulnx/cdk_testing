import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';


export class CdkTestingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MyVpc', { maxAzs: 2 });  // Adjust as needed

    const repo_uri = "241413258911.dkr.ecr.us-east-1.amazonaws.com/jf-test"
    const repo_arn = "arn:aws:ecr:us-east-1:241413258911:repository/jf-test"
    const queue_aurl = "https://sqs.us-east-1.amazonaws.com/241413258911/jf-test-queue"
    const queue_arn = "arn:aws:sqs:us-east-1:241413258911:jf-test-queue"

    const queue = Queue.fromQueueArn(
      this,
      `jf-test-queue`,
      queue_arn,
    );
    const ec2Role = new iam.Role(this, `jf-ec2-role`, {
      roleName: `jf-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      // assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    ec2Role.addToPolicy(
      new PolicyStatement({
        actions: [`logs:CreateLogStream`, `logs:PutLogEvents`],
        resources: [`*`],
      }),
    );

    ec2Role.addToPolicy(
      new PolicyStatement({
        actions: [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ],
        resources: [repo_arn],
      }),
    );
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:*'],
        resources: [
          `arn:aws:sqs:us-east-1:241413258911:jf-test-queue`,
        ],
      }),
    );

    // Security group stuff
    const instanceSecurityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc: vpc, // Specify your VPC
      allowAllOutbound: true, // Allow outbound traffic
    });

    // Allow SSH and PING inbound traffic to your EC2 instance
    instanceSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');
    instanceSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.icmpPing(), 'Allow ICMP (ping)');


    // Create an Amazon EC2 instance
    const instance = new ec2.Instance(this, 'MyInstance', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc,
      role: ec2Role,
      securityGroup: instanceSecurityGroup, 
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      associatePublicIpAddress: true,
      keyName: 'jf-key-pai',
    });

    // Create an ECR repository
    const ecrRepo = ecr.Repository.fromRepositoryArn(
      this, `cdk_test_repo`, repo_arn,
    );

    // Grant the EC2 instance permissions to pull from the ECR repository
    ecrRepo.grantPull(instance);

    // Pull and start the image


    // Install Docker on ec2 instance
    instance.addUserData(
      'yum install -y docker',
      'yum install -y polkit',
      'usermod -a -G docker ec2-user',
      'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 241413258911.dkr.ecr.us-east-1.amazonaws.com',
      'service docker start',
    );

    // Run a Docker container on the EC2 instance
    instance.addUserData(
      `docker run -d -p ${repo_uri}:latest`,
    );

     // Create a CloudWatch Logs group and stream
     const logGroup = new logs.LogGroup(this, 'MyLogGroup', {
      logGroupName: '/ecs/my-ecr-app',  // Customize the log group name
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // Specify the removal policy
    });

    const logStream = new logs.LogStream(this, 'MyLogStream', {
      logGroup,
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // Specify the removal policy
    });

    // Define a CloudWatch Logs stream for the EC2 instance
    instance.userData.addCommands(
      `echo 'export CW_LOG_GROUP=${logGroup.logGroupName}' >> /etc/environment`,
      `echo 'export CW_LOG_STREAM=${logStream.logStreamName}' >> /etc/environment`
    );

    // Install and configure the CloudWatch Logs agent on the EC2 instance
    instance.userData.addCommands(
      'yum install -y awslogs',
      'service awslogs start',
      'chkconfig awslogs on'
    );

    // ensure ec2 can write to log group
    logGroup.grantWrite(instance.role!);
    // END New Section
  }
}

const app = new cdk.App();
new CdkTestingStack(app, 'CdkTestingStack');
