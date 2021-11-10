'use strict'

const _ = require('lodash')
const axios = require('axios')
const { v4: uuidv4, validate: isUuid } = require('uuid')
const AWS = require('aws-sdk')
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})
const rekognizer = new AWS.Rekognition()
const blobsBucket = process.env.BUCKET_NAME
const { createBlob, updateBlob, readBlob } = require('./crud')

module.exports.getUploadUrl = async (event) => {
  try {
    const requestBody = JSON.parse(event.body)
    const callbackUrl = requestBody?.callback_url
    const blobId = uuidv4()
    const blob = await createBlob(blobId, callbackUrl)
    if (!_.isEmpty(blob) && blob.error) {
      console.log('Error creating blob ', blob.error)
      return {
        statusCode: blob.error.statusCode,
        body: JSON.stringify({
          success: false,
          message: 'Error creating blob'
        })
      }
    }

    // generate signed url
    const url = await s3.getSignedUrlPromise('putObject', {
      Bucket: blobsBucket,
      Key: blobId,
      Expires: 3600 // One hour
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Upload url generated successfully.',
        url
      })
    }
  } catch (err) {
    console.log('Error generating upload url ', err)
    return {
      statusCode: err.statusCode || 502,
      body: JSON.stringify({
        success: false,
        message: 'Error generating upload url'
      })
    }
  }
}

module.exports.detectImageLabels = async (event) => {
  try {
    const lastUploadedImage = event.Records[0].s3.object.key
    const params = {
      Image: {
        S3Object: {
          Bucket: blobsBucket,
          Name: lastUploadedImage
        }
      },
      MaxLabels: 10
    }
    const response = await rekognizer.detectLabels(params).promise()

    const labels = []
    response.Labels.forEach(label => {
      labels.push(_.pick(label, ['Name', 'Confidence']))
    })

    // Save labels to dynamoDB
    await updateBlob(lastUploadedImage, labels)
  } catch (err) {
    console.log('Error saving labels ', err)
  }
}

module.exports.getBlobInfoById = async (event) => {
  try {
    const blobId = event.pathParameters.id
    if (_.isNil(blobId) || !isUuid(blobId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Invalid blob id.'
        })
      }
    }

    const blobInfo = await readBlob(blobId)
    if (!_.isEmpty(blobInfo)) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Image labels retrieved successfully.',
          labels: blobInfo.Item.labels
        })
      }
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: 'There are no labels for this blob'
        })
      }
    }
  } catch (err) {
    console.log('Error getting blob labels', err)
    return {
      statusCode: err.statusCode || 502,
      body: JSON.stringify({
        success: false,
        message: 'Error getting blob labels'
      })
    }
  }
}

module.exports.sendBlobInfo = async (event) => {
  event.Records.forEach((record) => {
    if (record.eventName === 'MODIFY') {
      const callbackUrl = record.dynamodb.NewImage.callback_url.S

      // check if there is a callback url
      if (!_.isNil(callbackUrl)) {
        const blobId = record.dynamodb.NewImage.blobId.S
        const labels = record.dynamodb.NewImage.labels.L
        const message = JSON.stringify({
          blob_id: blobId,
          labels: labels
        })

        // send labels to the callback url
        axios.post(callbackUrl,
          message,
          {
            headers: { 'content-type': 'application/json' }
          })
      }
    }
  })
}
