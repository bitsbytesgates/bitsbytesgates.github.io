---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

#layout: home
layout: default
#title: Home
mermaid: true
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

{% if site.posts.first.series %}
<br/>
<br/>
{% assign seriesPosts = site.posts | sort: "date" | where_exp: "post", "post.series == site.posts.first.series" %}
{% if seriesPosts.size >= 1 %}
<h2>Posts in the series "{{ site.posts.first.series }}"</h2>
<ul>
    {% for post in seriesPosts %}
        {% if post.title != site.posts.first.title %}
            <li><a href="{{ post.url }}">{{post.title}}</a></li>
        {% else %}
            <li>{{post.title}}</li>
        {% endif %}
    {% endfor %}
    </ul>
{% endif %}
{% endif %}

<div>
  <br/>
  <h3>Bits, Bytes, and Gates Direct to your Inbox</h3>
  {% include subscribe.html %}
  <br/>
  <br/>
</div>
