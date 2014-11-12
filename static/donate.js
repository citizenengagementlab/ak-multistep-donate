var clearErrors = window.actionkit.forms.clearErrors;

maxLength = function(obj,length) {
    if (obj.val().length >= length) { 
      return false; 
    } else {
      return true;
    }
}

country_change = function() {
     country = $('#country').val();
     if (country == 'United States') {
        $('#us_billing_fields').show();
        $('#intl_billing_fields').hide();
     } else {
        $('#us_billing_fields').hide();
        $('#intl_billing_fields').show();
     }
}

makeLabelsInvisible = function() {
  $('form input[type=text], form input[type=email]').each(function(index, elem) {
    var eId = $(elem).attr('id');
    var label = null;
    if (eId && (label = $(elem).parents('form').find('label[for='+eId+']')).length === 1) {
        $(elem).attr('placeholder', $(label).html());
        $(label).addClass('hide-label');
    }
 });
}

/*TODO: This should be one function */

clear_radio_buttons = function() {
 $('input.donate_radio_button').attr('checked', false);
}

clear_other = function() {
 $('#amount_donate_other').val("");
}

clear_tip = function() {
 $('.amount_radio_button').attr('checked', false);
}

clear_other_tip = function() {
 $('.amount_other_field').parent().removeClass('active');
 $('.amount_other_field').val("");
}

addDonationToTotal = function(amount) {
  checked_donation = parseInt($('#amount_donate_' + amount).val());
  if (checked_donation >= 0) {
    $('.donation-amount').val(checked_donation);
    // console.log('new donation from radio buttons is ' + $('.donation-amount').val());
    // console.log('tip amount is ' + $('input[name=amount]').val());
  } else {
    var other_donate = $('#amount_donate_other').val();
    if (other_donate && /^(\$|)([0-9]|\d{0,2}(\,\d{3})*|([1-9]\d*))(\.\d{2})?$/.test(other_donate)) {
      $('.donation-amount').val(other_donate);
      // console.log('new donation from other field is ' + $('.donation-amount').val());
      // console.log('tip amount is ' + $('input[name=amount]').val());
    } 
  }
}

validateFirstPanel = function(i, link) {
  var abort = false;
  checkPanel = function() {
      var errors = false,
          amount_checked = $('.donation-amount').val();
      if (amount_checked) {
        formValid = true;
      } else {
         var other = parseFloat($('#amount_donate_other').val());
         if (other === "") {
           var errors = "<li>Donation amount is required.</li>"; 
         } else if (other < 0) {
           var errors = "<li>Sorry, donations below $1.00 are not allowed.</li>"; 
         } else if (!/^(?!\(.*[^)]$|[^(].*\)$)\(?\$?(0|[1-9]\d{0,2}(,?\d{3})?)(\.\d\d?)?\)?$/.test(other)) {
           var errors = "<li>Please enter a valid donation amount.";
         }
       } 
       return errors;
     }

  var errors = checkPanel();
  if (errors) { 
    clearErrors();
    $('#ak-errors').append(errors).show(); 
    abort = true;
  } else {

    $(".form-progress-indicator .active").removeClass("active");
    $(".progress-stage").fadeOut(300,function(){
    setTimeout(function(){
    $("#"+link).fadeIn(300);
    },305);
    });
    $(".form-progress-indicator").find("."+link).addClass("active");
    var newIndex = $(".form-progress-indicator li.active").index();

    $(".form-progress-indicator li:lt(" + newIndex + ")").addClass("completed");
    //clear previous errors if we've validated properly
    clearErrors();
  }

  return abort;
}

validateSecondPanel = function(i, link) {
  window.actionkit.forms.tryToValidate();
  var abort = false;

  if ($('.progress-stage').eq(i-1).find('.ak-err').is(":visible")) {
    //international pages don't validate zip lololol
    var regPostalCode = new RegExp("^\\d{5}(-\\d{4})?$"),
        postal_code = $("input[name='zip']").val();

    if (regPostalCode.test(postal_code) === false) {
      var errorMsg = window.actionkit.forms.errorMessage('zip:invalid')
      $('input[name=zip]').parent().append('<ul class="ak-err" style="display: block;"><li>' + errorMsg + '</li></ul>')
    }

    abort = true;
  }

  return abort;
}


validateThirdPanel = function(i, link) {
  var abort = false;
  var cardValidator = function(name, regExp) {
    this.el = $("input[name=" + name + "]");
    this.regExp =  new RegExp(regExp);
    this.errorMsg =  window.actionkit.forms.errorMessage(name+":invalid");
    this.renderError =  function() { 
      return $('#ak-errors').show().append('<li>' + this.errorMsg + '</li>');
    }
    this.validate = function() {
      if (this.regExp.test(this.el.val()) === false) {
        return this.renderError();
      }
    }
  }

  clearErrors();

  var cardNumberRegExp = "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$",
      cardMonthRegExp = "^[0-9]{2}$",
      cardYearRegExp = "^[0-9]{4}$",
      cardCodeRegExp = "^[0-9]{3}$";

  window.cardNumber = new cardValidator('card_num', cardNumberRegExp);
  var cardMonth = new cardValidator('exp_date_month', cardMonthRegExp),
      cardYear = new cardValidator('exp_date_year', cardYearRegExp),
      cardCode = new cardValidator('card_code', cardCodeRegExp);

   cardNumber.validate(); 
    cardMonth.validate();   
     cardYear.validate(); 
     cardCode.validate(); 

   if ($('#ak-errors').is(":visible")) {
    abort = true;
   }

   return abort;
}

//omg why am i not using a framework!??!?!?
addAmountsToView = function() {
  //since we always prepend to the front in the DOM, 
  //we need to reverse so that we order things largest to smallest
  //betcha there's a better way!
  donation_amounts.reverse().forEach(function(f) {
    $('#donateAmounts').prepend('<span><input type="radio" value="' + f + '" class="donate_radio_button" id="amount_donate_' + f + '"><label for="amount_donate_' + f + '" class="amount-button">$' + f + '</label></span>');
  });
}

//for some reason, AK isn't populating zip + state 
//even though they are present in args.
//this function should really just trigger displaying
//the third panel, but we have to add some data 
//back into the form too.
handleServerErrors = function() {
   originalCallback = window.actionkit.forms.onContextLoaded;
   actionkit.forms.onContextLoaded = function () {
    userData = {
      "amount": window.actionkit.args.amount,
      "zip": window.actionkit.args.zip,
      "state": window.actionkit.args.state
    }
    
    for (d in userData) {
      if (typeof userData[d] !== undefined)  {
        if (d === "amount") {
          if ($('#amount_donate_other').val() === undefined || $('#amount_donate_other').val() === "") {
            $('#amount_donate_' + userData[d]).click();
          } 
        } else if (d === "state") {
          $('select[name=' + d + ']').val(userData[d]);
        } else {
          $('input[name=' + d + ']').val(userData[d]);
        }
      }
    }
    
    originalCallback.apply(this, arguments);
    window.actionkit.forms.handleQueryStringErrors()
  };
  
  $('li.stage-3').click(); 
}


setDonationHandlers = function() {
  $('.donate_radio_button').on('click', function(e) {
    donation = this.value;
    window.actionkit.forms.clearErrors();
    clear_other();
    $('.donate_radio_button').not($(this)).parent().removeClass('active');
    $('#amount_donate_other').parent().removeClass('active');
    $(this).parent().addClass('active');
    addDonationToTotal(donation);
  });

  $('input[name=donation_type]').on('click', function() {
    $('input[name=donation_type]').not($(this)).parent().removeClass('active');
    $(this).parent().addClass('active');
  })

  $('#amount_donate_other').on('focus', function() { 
    clear_radio_buttons()
    $('.donate_radio_button').not($(this)).parent().removeClass('active');
    $(this).parent().addClass('active');
  });

  $('#amount_donate_other').on('blur', function() { 
    window.actionkit.forms.clearErrors();
    addDonationToTotal();
  });
}

setTipHandlers = function() { 
  $('.amount_radio_button').on('click', function() {
    $('.amount_radio_button').not($(this)).parent().removeClass('active');
    $(this).parent().addClass('active');
    clear_other_tip();
  });

  $('#amount_other_field').on('focus', function() {
    $('.amount_radio_button').not($(this)).parent().removeClass('active');
    $(this).parent().addClass('active');
    clear_tip();
  });
}

setNavHandlers = function() { 
 $(".menu-icon a").on("click", function() {
   $(".mobilemenu").fadeToggle("slow");
     $(this).toggleClass("open");
   
   var path = window.location.pathname;
    $(".mobilemenu ul li a").each(function(){ if(path==$(this)[0].pathname || path=="/"+$(this)[0].pathname)  
    $(this).parent().addClass("activepage");  
  })  
 });
}

setFormHandlers = function() {
  //if either the next link or the header at the top is clicked
  //maybe should split into separate events
  $(".progress-stages .progress-stage .progress-stage-button-next a, li.progress-indicator-stage").click(function(e) {

    nextButton = $(this).parent().hasClass('button'),
    headerLink = $(this).hasClass('progress-indicator-stage');

    


      var link = $(this).attr("data-link"),
          clickIndex = parseInt(link.split('-')[1]),
          i = $('.progress-stage:visible').index(),
          abort = false;


        if (i > clickIndex) {
          $(".form-progress-indicator .active").removeClass("active");
          $(".progress-stage").fadeOut(300, function() { 
            setTimeout(function() {
              $("#"+link).fadeIn(300);
            }, 305);
          });
          $(".form-progress-indicator").find("."+link).addClass("active");
          return false;
        } 

        if (nextButton && i === 1 || headerLink && clickIndex === 2) {
          abort = validateFirstPanel(i, link);
        }

        if (nextButton && i === 2 || headerLink && clickIndex === 3) {
          abort = validateSecondPanel(i, link);
        }

        if (nextButton && i === 3 || headerLink && clickIndex === 4) {
          abort = validateThirdPanel(i, link);
        }
    
        //final check, if abort is set we don't make the switch.
        if (!abort) {
          $(".form-progress-indicator .active").removeClass("active");
          $(".progress-stage").fadeOut(300,function(){
            setTimeout(function(){
              $("#"+link).fadeIn(300);
            },305);
          });
    
          $(".form-progress-indicator").find("."+link).addClass("active");
        
          var completedIndex = $(".form-progress-indicator li.active").index();
      
          $(".form-progress-indicator li:lt("+completedIndex+")").addClass("completed");
         
        } else {
          return false; //bummerz
        }
    });
}

//TODO: why am i not using a framework
init = function() {
  addAmountsToView(); 
  makeLabelsInvisible();
  setDonationHandlers();
  setTipHandlers();
  setNavHandlers();
  setFormHandlers();
}

$(document).ready(function() {

    jQuery('.share-btn .yellow-btn').click(function(e){
    e.stopPropagation();
    jQuery('#tweet-pop').fadeOut();
    jQuery('#share-pop').fadeToggle();
  });
  jQuery('.tweet-btn .yellow-btn').click(function(e){
    e.stopPropagation();
    jQuery('#share-pop').fadeOut();
    jQuery('#tweet-pop').fadeToggle();
  });
    jQuery(document).click(function() {
      jQuery('#share-pop').fadeOut();
    jQuery('#tweet-pop').fadeOut();
    });
  jQuery('#share-pop').click(function(e){
    e.stopPropagation();
  });
  jQuery('#tweet-pop').click(function(e){
    e.stopPropagation();
  });

  init();
  qs = window.location.search;
  if (qs.search('error') !== -1) {
    handleServerErrors();
  }
});