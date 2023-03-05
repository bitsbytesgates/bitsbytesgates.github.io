---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

#layout: home
layout: default
#title: Home
---

<div class="blog-index">  
  {% assign post = site.posts.first %}
  {% assign content = post.content %}
  {% include post_detail.html %}
</div>

  <div/>
  <center>
  <b>Copyright 2014-{{ site.time | date: '%Y' }} Matthew Ballance. All Rights Reserved</b>
  </center>
  <em>The views and opinions expressed above are solely those of the author and do not 
      represent those of my employer or any other party.</em>
