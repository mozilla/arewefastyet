<ul id="navbar">
 <li>Machines &#187;
  <ul>
   {foreach from=$machines item=machine}
    {if $machine_id == $machine.id}
     <li><a href="#">&#x2713; {$machine.info}</a></li>
    {else}
     <li><a href="{$url_machine}&amp;machine={$machine.id}">{$machine.info}</a></li>
    {/if}
   {/foreach}
  </ul>
 </li>
 <li>Test View &#187;
  <ul>
   {foreach from=$views item=v}
    {if $view == $v.id}
    <li><a href="#">&#x2713; {$v.name}</a></li>
    {else}
    <li><a href="{$url_view}&amp;view={$v.id}">{$v.name}</a></li>
    {/if}
   {/foreach}
  </ul>
 </li>
 <li>About &#187;
  <ul>
   <li><a href="faq.html">FAQ</a></li>
   <li><a href="old-awfy.php">Historic View</a></li>
   <li><a href="mailto:danderson@mozilla.com">Suggestions</a></li>
  </ul>
 </li>
</ul>
