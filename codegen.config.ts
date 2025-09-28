import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'lib/constructs/api/schema/schema.graphql',
  generates: {
    'lib/constructs/compute/lambda/types/generated.ts': {
      plugins: [
        'typescript',
        'typescript-resolvers'
      ],
      config: {
        scalars: {
          AWSDateTime: 'string',
          AWSEmail: 'string',
          AWSJSON: 'string',
          AWSPhone: 'string',
          AWSURL: 'string'
        },
        enumsAsTypes: false,
        futureProofEnums: true,
        useIndexSigniture: true,
        contextType: './context#AppSyncContext'
      }
    }
  }
}

console.log(config.generates)

export default config
