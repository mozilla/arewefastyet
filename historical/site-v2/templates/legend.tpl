<ul id="legend">
 {foreach from=$cx->modes item=v}
  {if $v.used == true}
   <li style="border-color: {$v.color}">{$cx->vendors[$v.vendor].vendor}
{$cx->vendors[$v.vendor].browser} ({$v.name})</li>
  {/if}
 {/foreach}
</ul>

