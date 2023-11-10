#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkTestingStack } from '../lib/cdk_testing-stack';
import { SqsQueueProcessingService } from '../lib/queueprocessingec2service';

const app = new cdk.App();
new CdkTestingStack(app, 'CdkTestingStack');
new SqsQueueProcessingService(app, 'SqsQueueProcessingService');
