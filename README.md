# Reko (Image Recognizer)

## Start
``` bash
npm install -g serverless
npm install
sls deploy
```


## Documentation
[DOCS](./docs/reko.yml)

### => Get upload url
> Request

```
POST https://path.execute-api.us-east-1.amazonaws.com/blobs

body

{
  "callback_url": "http://example.com/callback"
}

```

> Response
```
{
    "success": true,
    "message": "Upload url generated successfully.",
    "url": "https://s3bucket.s3.amazonaws.com/2261f5ab-3b17-4c17-8108-3edf757ddddb?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYYBKHMVVZAAUHVAD%2F20211110%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20211110T102024Z&X-Amz-Expires=3600&X-Amz-Signature=44654ba9715e8185649b34ae1a57c4f1bb31b526a3f28c0627d7a141f41e3003&X-Amz-SignedHeaders=host"
}
```

### => Get blob info
> Request

```
GET https://path.execute-api.us-east-1.amazonaws.com/blobs/0716caba-b006-4cba-bbe0-b0337dd80026

```

> Response
```
{
    "success": true,
    "message": "Image labels retrieved successfully.",
    "labels": [
        {
            "Confidence": 95.94786071777344,
            "Name": "Plant"
        },
        {
            "Confidence": 92.54127502441406,
            "Name": "Food"
        },
        {
            "Confidence": 83.06842803955078,
            "Name": "Fruit"
        },
        {
            "Confidence": 76.1105728149414,
            "Name": "Produce"
        }
    ]
}
```

 