##
## This file is only needed for Compass/Sass integration. If you are not using
## Compass, you may safely ignore or delete this file.
##
## If you'd like to learn more about Sass and Compass, see the sass/README.txt
## file for more information.
##

# Change this to :production when ready to deploy the CSS to the live server.
environment = :development

# Location of the theme's resources.
css_dir = "css"
sass_dir = "sass"
images_dir = "images"
generated_images_dir = images_dir + "/generated"
javascripts_dir = "js"

# Require any additional compass plugins installed on your system.
require 'compass-normalize'
require 'rgbapng'
require 'toolkit'
require 'susy'

##
## You probably don't need to edit anything below this.
##

# You can select your preferred output style here (:expanded, :nested, :compact
# or :compressed).
output_style = (environment == :development) ? :expanded : :expanded

# To enable relative paths to assets via compass helper functions. Since Drupal
# themes can be installed in multiple locations, we don't need to worry about
# the absolute path to the theme from the server omega.
relative_assets = true

# Conditionall enable line comments when in development mode.
line_comments = (environment == :development) ? true : false

# Output debugging info in development mode.
sass_options = (environment == :development) ? {:debug_info => true} : {}