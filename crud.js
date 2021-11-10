const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const blobsTable = process.env.DYNAMODB_TABLE

const createBlob = async (blobId, callbackUrl) => {
  try {
    const params = {
      TableName: blobsTable,
      Item: {
        blobId: blobId,
        callback_url: callbackUrl
      }
    }
    await dynamoDb.put(params).promise()
  } catch (err) {
    return {
      error: err
    }
  }
}

const updateBlob = async (lastUploadedImage, labels) => {
  try {
    const updateParams = {
      TableName: blobsTable,
      Key: {
        blobId: lastUploadedImage
      },
      UpdateExpression: 'set labels = :labels',
      ExpressionAttributeValues: {
        ':labels': labels
      },
      ReturnValues: 'UPDATED_NEW'
    }
    await dynamoDb.update(updateParams).promise()
  } catch (err) {
    console.log(err)
  }
}

const readBlob = async (blobId) => {
  try {
    const params = {
      TableName: blobsTable,
      Key: {
        blobId: blobId
      }
    }
    const blobInfo = await dynamoDb.get(params).promise()
    return blobInfo
  } catch (err) {
    console.log('Error retrieving blob', err)
  }
}

module.exports = {
  createBlob,
  updateBlob,
  readBlob
}
