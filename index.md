---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

#layout: home
layout: default
title: Home
---

Here is some text to show where the body should be.

<div class="blog-index">  
  {% assign post = site.posts.first %}
  {% assign content = post.content %}
  {% include post_detail.html %}
</div>