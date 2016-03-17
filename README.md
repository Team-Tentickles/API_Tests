# API_Tests
Testing ROVI and ECHO API on Node.JS

#Echo API
Messing around with some API calls onto the echonest API using a node.js client [made by dinostheo](https://github.com/dinostheo/echonestjs)

#Rovi API
Messing around with some API calls onto the Roci API using a node.js client [made by reccanti](https://github.com/reccanti/rovijs)

#Installation
`npm install`

`npm start`


##Future Work
So the server is gonna send an object in the structure of:

```
{
  first:{
    images:[
      {url: <image url>}
      {url: <image url>}
    ],
    video:[
      {url: <video url>}
    ],
    influecers:[
      {name: <Influencer name>},
      {name: <Influencer name>}
    ]
  },
  second:{
    <With all the same properties as first>
  },
  similar:{
    <With all the same properties as first and second>
  }
}
```


So, for example, if I wanted to get the second image of the second artist, I would use:
```
second.images[1].url
```
If I wanted to get the first influecer of the similar artist, I would use:
```
similar.influencers[0].name
```
