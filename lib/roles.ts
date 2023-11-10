
const taskRole = new iam.Role(this, `${prefix}-SegmentationTaskRole`, {
    roleName: `${prefix}-SegHMTaskRole-ent-dev`,
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  const containerRole = new iam.Role(this, `${prefix}-SegmentationContainerRole`, {
    roleName: `${prefix}-SegHMContainerRole-ent-dev`,
    assumedBy: new iam.ServicePrincipal('ecs.amazonaws.com'),
  });
  containerRole.addToPolicy(
    new PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: ['arn:aws:logs:*:*:*'],
    }),
  );

  taskRole.addToPolicy(
    new PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: ['arn:aws:logs:*:*:*'],
    }),
  );

  taskRole.addToPolicy(
    new PolicyStatement({
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:DeleteItem',
        'dynamodb:UpdateItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:BatchWriteItem',
        'dynamodb:DescribeTable',
        'dynamodb:BatchGetItem',
      ],
      resources: [
        `arn:aws:dynamodb:us-east-1:241413258911:table/Image-ent-dev`,
      ],
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject', 's3:GetObject'],
      resources: [
        `arn:aws:s3:::uploads-241413258911-ent-dev/*`,
        `arn:aws:s3:::features-241413258911-ent-dev/*`,
      ],
    }),
  );