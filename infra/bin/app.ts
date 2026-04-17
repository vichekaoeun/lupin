#!/usr/bin/env node
// CDK app entry point. See README for deploy instructions.

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SakuraStack } from '../lib/sakura-stack';

const app = new cdk.App();

const envDef = {
  account: process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
};

// ── Dev ──────────────────────────────────────────────────────────────────────
new SakuraStack(app, 'SakuraStack-dev', {
  env: envDef,
  env_name: 'dev',
  githubToken: process.env.GITHUB_TOKEN,
  githubOwner: process.env.GITHUB_OWNER,
  githubRepo: process.env.GITHUB_REPO,
  description: 'Sakura SRS — development environment',
});

// ── Staging ──────────────────────────────────────────────────────────────────
new SakuraStack(app, 'SakuraStack-staging', {
  env: envDef,
  env_name: 'staging',
  description: 'Sakura SRS — staging environment (mirrors prod)',
});

// ── Production ───────────────────────────────────────────────────────────────
new SakuraStack(app, 'SakuraStack-prod', {
  env: envDef,
  env_name: 'prod',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  githubToken: process.env.GITHUB_TOKEN,
  githubOwner: process.env.GITHUB_OWNER,
  githubRepo: process.env.GITHUB_REPO,
  description: 'Sakura SRS — production environment',
});

app.synth();
