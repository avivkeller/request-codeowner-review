export interface GitHubContext {
  owner: string;
  repo: string;
  pullNumber: number;
}

export interface ActionInputs {
  token: string;
  failOnError: boolean;
  outputMode: 'review' | 'comment';
}
