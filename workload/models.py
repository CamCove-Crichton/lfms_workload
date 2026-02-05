from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Owner(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True)
    current_id = models.PositiveIntegerField(unique=True)
    current_uuid = models.UUIDField(unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    bookable = models.BooleanField(default=False)
    membership_id = models.PositiveIntegerField()
    membership_type = models.CharField(max_length=50)
    lawful_basis_id = models.PositiveIntegerField()
    lawful_basis_type_name = models.CharField(max_length=100)
    tags = models.ManyToManyField(Tag, blank=True, related_name='owners')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Client(models.Model):
    current_id = models.PositiveIntegerField(unique=True)
    current_uuid = models.UUIDField(unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='clients')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Venue(models.Model):
    current_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    street = models.CharField(max_length=100, null=True, blank=True)
    postcode = models.CharField(max_length=15, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    county = models.CharField(max_length=150, null=True, blank=True)
    country = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Opportunity(models.Model):
    current_id = models.IntegerField(unique=True)
    owner = models.ForeignKey(Owner, on_delete=models.SET_NULL, null=True, related_name='opportunities')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, related_name='opportunities')
    order_number = models.CharField(max_length=20)
    opportunity_name = models.CharField(max_length=255)
    previous_opportunity_name = models.CharField(max_length=255, blank=True)
    dry_hire = models.CharField(max_length=3)
    dry_hire_transport = models.CharField(max_length=3)
    status = models.IntegerField()
    status_name = models.CharField(max_length=30)
    previous_status_name = models.CharField(max_length=30, blank=True)
    starts_at = models.DateTimeField()
    previous_starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField()
    previous_ends_at = models.DateTimeField(null=True, blank=True)
    load_starts_at = models.DateTimeField(null=True, blank=True)
    previous_load_starts_at = models.DateTimeField(null=True, blank=True)
    load_ends_at = models.DateTimeField(null=True, blank=True)
    previous_load_ends_at = models.DateTimeField(null=True, blank=True)
    deliver_starts_at = models.DateTimeField(null=True, blank=True)
    previous_deliver_starts_at = models.DateTimeField(null=True, blank=True)
    deliver_ends_at = models.DateTimeField(null=True, blank=True)
    previous_deliver_ends_at = models.DateTimeField(null=True, blank=True)
    setup_starts_at = models.DateTimeField(null=True, blank=True)
    previous_setup_starts_at = models.DateTimeField(null=True, blank=True)
    setup_ends_at = models.DateTimeField(null=True, blank=True)
    previous_setup_ends_at = models.DateTimeField(null=True, blank=True)
    show_starts_at = models.DateTimeField(null=True, blank=True)
    previous_show_starts_at = models.DateTimeField(null=True, blank=True)
    show_ends_at = models.DateTimeField(null=True, blank=True)
    previous_show_ends_at = models.DateTimeField(null=True, blank=True)
    takedown_starts_at = models.DateTimeField(null=True, blank=True)
    previous_takedown_starts_at = models.DateTimeField(null=True, blank=True)
    takedown_ends_at = models.DateTimeField(null=True, blank=True)
    previous_takedown_ends_at = models.DateTimeField(null=True, blank=True)
    collect_starts_at = models.DateTimeField(null=True, blank=True)
    previous_collect_starts_at = models.DateTimeField(null=True, blank=True)
    collect_ends_at = models.DateTimeField(null=True, blank=True)
    previous_collect_ends_at = models.DateTimeField(null=True, blank=True)
    unload_starts_at = models.DateTimeField(null=True, blank=True)
    previous_unload_starts_at = models.DateTimeField(null=True, blank=True)
    unload_ends_at = models.DateTimeField(null=True, blank=True)
    previous_unload_ends_at = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='opportunities')
    weight_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name='opportunities')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    previously_updated_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.opportunity_name
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name_plural = 'Opportunities'


class ScenicCalcItems(models.Model):
    current_item_id = models.IntegerField()
    name = models.CharField(max_length=50)
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='scenic_calc_items')
    item_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,)
    previous_item_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    previously_updated_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Scenic Calc Items for {self.opportunity}"
    
    class Meta:
        verbose_name_plural = 'Scenic calc item groups'


class ScenicCalcItem(models.Model):
    current_id = models.IntegerField()
    opportunity_id = models.IntegerField()
    current_item_id = models.IntegerField()
    current_item_type = models.CharField(max_length=10)
    opportunity_item_type = models.IntegerField()
    opportunity_item_type_name = models.CharField(max_length=15)
    scenic_items = models.ForeignKey(ScenicCalcItems, on_delete=models.CASCADE, null=True, blank=True, related_name='items')
    name = models.CharField(max_length=50)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(max_length=250, blank=True)
    previous_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    previously_updated_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} (Qty: {self.quantity})"


class ScenicCalcTotal(models.Model):
    opportunity = models.OneToOneField(Opportunity, on_delete=models.CASCADE, related_name='scenic_calc_total')
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    previous_grand_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    previously_updated_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Totals for {self.opportunity}"


class CustomInput(models.Model):
    opportunity = models.OneToOneField(Opportunity, on_delete=models.CASCADE, related_name='custom_input')
    include_weekends = models.BooleanField()
    previous_include_weekends = models.BooleanField(null=True, blank=True)
    num_of_carpenters = models.IntegerField()
    previous_num_of_carpenters = models.IntegerField(null=True, blank=True)
    planned_finish_date = models.DateField(null=True, blank=True)
    previous_planned_finish_date = models.DateField(null=True, blank=True)
    built = models.BooleanField()
    working_days = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    previous_working_days = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    start_build_date = models.DateField(null=True, blank=True)
    previous_start_build_date = models.DateField(null=True, blank=True)
    date_out = models.DateField(null=True, blank=True)
    previous_date_out = models.DateField(null=True, blank=True)
    time_out = models.TimeField(null=True, blank=True)
    previous_time_out = models.TimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    previously_updated_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # If the record already exists, prevserve the current data before it changes
        if self.pk is not None:
            try:
                old = CustomInput.objects.get(pk=self.pk)
                if old.updated_at:
                    self.previously_updated_at = old.updated_at
                if old.working_days is not None:
                    self.previous_working_days = old.working_days
                if old.start_build_date is not None:
                    self.previous_start_build_date = old.start_build_date
                if old.planned_finish_date is not None:
                    self.previous_planned_finish_date = old.planned_finish_date
                if old.include_weekends is not None:
                    self.previous_include_weekends = old.include_weekends
                if old.num_of_carpenters is not None:
                    self.previous_num_of_carpenters = old.num_of_carpenters
                # if old.date_out is not None:
                #     self.previous_date_out = old.date_out
                # if old.time_out is not None:
                #     self.previous_time_out = old.time_out
            except CustomInput.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Custom Input for {self.opportunity}"


class Carpenters(models.Model):
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='carpenter_groups')
    custom_input = models.ForeignKey(CustomInput, on_delete=models.CASCADE, related_name='carpenter_groups')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Carpenters Group for {self.opportunity}"
    
    class Meta:
        verbose_name_plural = 'Carpenter groups'


class Carpenter(models.Model):
    carpenters = models.ForeignKey(Carpenters, on_delete=models.CASCADE, related_name='carpenters')
    fname = models.CharField(max_length=30)
    lname = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.fname} {self.lname}"
    
    class Meta:
        ordering = ['lname', 'fname']
        verbose_name_plural = 'Carpenters'


class ActiveProducts(models.Model):
    current_id = models.IntegerField()
    name = models.CharField(max_length=255)
    product_type = models.CharField(max_length=10)
    description = models.TextField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} in Active Products"
    
    class Meta:
        verbose_name_plural = 'Active products'
