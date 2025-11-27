data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-vpc" }
  )
}

locals {
  az1 = data.aws_availability_zones.available.names[0]
  az2 = data.aws_availability_zones.available.names[1]
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, 0)
  availability_zone       = local.az1
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-public-1", Tier = "public" }
  )
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, 1)
  availability_zone       = local.az2
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-public-2", Tier = "public" }
  )
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, 2)
  availability_zone = local.az1

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-private-1", Tier = "private" }
  )
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, 3)
  availability_zone = local.az2

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-private-2", Tier = "private" }
  )
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-igw" }
  )
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-public-rt" }
  )
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}
