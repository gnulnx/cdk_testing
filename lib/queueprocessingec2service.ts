import * as cdk from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { AmiHardwareType, ContainerImage } from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { QueueProcessingEc2Service } from 'aws-cdk-lib/aws-ecs-patterns';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Node } from 'constructs';
import * as awsAutoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

// TODO Remove this
const sqs_message = {
    "Message": "_/e0885d8c-822c-45c7-9ba6-106ce04ae8ff/_"
  }

export class SqsQueueProcessingService extends Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const prefix = "jf-"

    // const account = process.env.ACCOUNT || '715930459276';
    // const region = process.env.REGION || 'us-east-1';

    const repository = ecr.Repository.fromRepositoryArn(
      this,
      `${prefix}SegHM-GPU-Repo`,
      `arn:aws:ecr:us-east-1:241413258911:repository/segmentation-gpu`,
    );

    // Create an sqs queue
    const queue = Queue.fromQueueArn(
      this,
      `${prefix}SegmentationQueue-ent-dev`,
      // `arn:aws:sqs:us-east-1:241413258911:SegmentationQueue-ent-dev`,
      "arn:aws:sqs:us-east-1:241413258911:jf-test-queue"
    );

    const vpc = new ec2.Vpc(this, `${prefix}Vpc`, { maxAzs: 1 });
    const cluster = new ecs.Cluster(this, `${prefix}EcsCluster`, { vpc });

    // This is the EC2 autoscaling
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, `${prefix}asg`, {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.G4DN,
        ec2.InstanceSize.XLARGE4,
      ),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(AmiHardwareType.GPU),
      minCapacity: 0,
      desiredCapacity: 1, // Deploy requires 1 instance running at deploy time to health check
      maxCapacity: 1,
      ssmSessionPermissions: true,
    });

    // This doesn't scaleout when QueueProcessingEc2Service.serverice.desiredCount is set to 0 even when sqs msgs are present
    // autoScalingGroup.scaleOnMetric(`${prefix}QueueMessagesVisibleScaling`, {
    //   metric: queue.metricApproximateNumberOfMessagesVisible(),
    //   adjustmentType: autoscaling.AdjustmentType.EXACT_CAPACITY,
    //   cooldown: cdk.Duration.seconds(60),
    //   scalingSteps: [
    //     { upper: 0, change: 0 },
    //     { lower: 1, change: 1 },
    //   ],
    // });
    const capacityProvider = new ecs.AsgCapacityProvider(this, `${prefix}provider`, {
      capacityProviderName: `${prefix}CapacityProvider`,
      autoScalingGroup,
      
      // Disable capacity-based scaling and rely solely on our message-based scaling
      enableManagedScaling: false,
      enableManagedTerminationProtection: false,
    });
    cluster.addAsgCapacityProvider(capacityProvider);

    // Create the ECS Service with the previously built Docker image
    const qps = new QueueProcessingEc2Service(this, `${prefix}SqsService`, {
      cluster: cluster,
      image: ContainerImage.fromEcrRepository(repository),
      environment: {
        PYTHONUNBUFFERED: `1`,
        imageTable: `Image-ent-dev`,
        uploadsBucket: `uploads-241413258911-ent-dev`,
        featuresBucket: `features-241413258911-ent-dev`,
        envName: `ent`,
        stage: `dev`,
        AWS_ACCOUNT_ID: `241413258911`,
        NVIDIA_DRIVER_CAPABILITIES: 'all',
        ECS_REMOVE_DEFAULT_DESIRED_COUNT: 'true',
      },
      queue: queue,
      gpuCount: 1,
      memoryLimitMiB: 1024 * 16,
      cpu: 1024 * 3, // Save 1 vCPU for Container
      minScalingCapacity: 1,
      maxScalingCapacity: 1,
      scalingSteps: [
        { upper: 0, change: -1 },
        { lower: 1, change: 1 },
      ],
      capacityProviderStrategies: [
        {
          capacityProvider: capacityProvider.capacityProviderName,
          weight: 1,
        },
      ],
    });

    // Initialize desriedTaskCount to 0 using the L1 construct
    const service = Node.of(qps.service).defaultChild as ecs.CfnService;
    service.addPropertyOverride('desiredCount', 0);

    const myRole = Node.of(qps.taskDefinition.taskRole).defaultChild as iam.CfnRole;
    myRole.managedPolicyArns = [
      `arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole`,
      `arn:aws:iam::aws:policy/AmazonSQSReadOnlyAccess`,
      `arn:aws:iam::aws:policy/AmazonS3FullAccess`,
      `arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess`,
    ];
  }
}
