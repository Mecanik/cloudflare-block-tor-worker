addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

const html = `<!doctype html>
<html lang="en">
  <head>
    <title>Access Denied</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous"> 
  </head>
  <body>
    <div class="container">
      <h1 class="mt-5 text-center">Oops!</h1>
      <h2 class="mt-2 text-center text-danger">TOR Network is not allowed.</h2>
    </div>
  </body>
</html>`;

async function handleRequest(request) 
{
  const clientIP = request.headers.get('CF-Connecting-IP');
  const ipset = await TOR_COMBINED_LIST.get("ipset", { type: "json", cacheTtl: 600 });
  
  if (ipset[clientIP]) 
  {
    return new Response(html, { 
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
      status: 403
    });
  }

  const response = await fetch(request);

  return response;
}