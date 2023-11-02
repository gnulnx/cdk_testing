#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkTestingStack } from '../lib/cdk_testing-stack';

const app = new cdk.App();
new CdkTestingStack(app, 'CdkTestingStack');
