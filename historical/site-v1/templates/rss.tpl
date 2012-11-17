<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
 <channel>
  <title>Are We Fast Yet?</title>
  <link>http://www.arewefastyet.com/</link>
  <description>Tracks JavaScript performance</description>
  <language>en-us</language>
  <pubDate>{$runs[0].date}</pubDate>
  <lastBuildDate>{$runs[0].date}</lastBuildDate>
  {foreach from=$runs item=run}
   <item>
    <title>{$run.cpu}-{$run.os} cset {$run.cset}</title>
    <link>http://www.arewefastyet.com/?machine={$run.machine}</link>
    <pubDate>{$run.date}</pubDate>
   </item>
  {/foreach}
 </channel>
</rss>

